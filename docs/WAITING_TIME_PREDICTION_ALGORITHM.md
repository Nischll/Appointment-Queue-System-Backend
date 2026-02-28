# Waiting Time Prediction Algorithm — Technical Documentation

This document explains how the **AQMS (Appointment Queue Management System)** predicts the approximate waiting time for an appointment. The system uses **historical metrics**, **live queue state**, and an optional **linear regression model** to produce a defensible estimate suitable for project documentation and defense.

---

## 1. When Is a Prediction Made?

A prediction is requested when:

- **Staff/clinic view**: Loading **today’s live appointments** (with waiting time) for a doctor/clinic/department.
- **Patient view**: A patient views their **live appointment** and the system shows “estimated wait” and queue position.

**Inputs** to the prediction service:

| Parameter        | Meaning                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `doctorId`      | Doctor conducting the appointment                                      |
| `clinicId`      | Clinic location                                                        |
| `departmentId`  | Department (e.g. General, Cardiology)                                  |
| `appointmentDate` | Date of the appointment (usually today)                             |
| `appointmentType` | Type (e.g. Counselling, Follow-up, Regular Checkup)                |
| `appointmentId` | Optional: ID of the appointment we are predicting for (to get position) |

---

## 2. High-Level Flow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PREDICT WAIT TIME REQUEST                                               │
│  (doctor, clinic, department, date, appointment type, appointment id)    │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Get historical metrics (for this doctor/clinic/dept/type)       │
│  → avg_duration, avg_start_delay, no_show_rate, sample_size             │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Get live queue for today                                        │
│  → Who is currently in progress? Who is ahead? My queue position?        │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: (Optional) Train linear regression on historical data          │
│  → Training data: past completed appointments (queue_number vs duration)│
│  → If model is trained and we have a position → use regression estimate │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Compute remaining time for current in-progress patient          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Sum estimated time for all patients ahead (with no-show adjustment)│
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Add average start delay + round → final predicted_wait_minutes  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Linear Regression — What It Does and Why

### 3.1 Idea

- **Observation**: Later in the queue, appointments often take longer (e.g. more complex cases, accumulated delay).
- **Model**: We assume a **linear relationship** between **queue position** and **actual consultation duration** for **completed** appointments of the **same type** with the **same doctor/clinic/department**.

So we model:

**Actual duration ≈ intercept + slope × queue_number**

- **X (queue_number)**: Position in the queue (1, 2, 3, …) on the day of that past appointment.
- **Y (actual_duration)**: Real consultation time in minutes (`actual_end_time − actual_start_time`) for **completed** appointments.

### 3.2 Training Data Source

Training data comes from **completed appointments only**:

- **Table**: `appointments`
- **Filters**: Same `doctor_id`, `clinic_id`, `department_id`, `appointment_type`; `status = 'COMPLETED'`; both `actual_start_time` and `actual_end_time` present and valid.
- **Columns used**:
  - `queue_number` → **X**
  - `(actual_end_time - actual_start_time)` in minutes → **Y** (`actual_duration`)

So we learn: “For this doctor, clinic, department, and appointment type, how did duration vary with queue position in the past?”

### 3.3 Mathematical Formulas (Ordinary Least Squares)

**Notation:**

- \( n \) = number of training rows (completed appointments)
- \( x_i \) = queue number of the \( i \)-th appointment
- \( y_i \) = actual duration in minutes of the \( i \)-th appointment

**Sums:**

\[
\sum x,\quad \sum y,\quad \sum xy,\quad \sum x^2
\]

**Slope:**

\[
\text{slope} = \frac{n \cdot \sum xy - \sum x \cdot \sum y}{n \cdot \sum x^2 - (\sum x)^2}
\]

**Intercept:**

\[
\text{intercept} = \frac{\sum y - \text{slope} \cdot \sum x}{n} = \bar{y} - \text{slope} \cdot \bar{x}
\]

**Prediction for a new queue position \( x_{\text{new}} \):**

\[
\text{predicted duration} = \text{intercept} + \text{slope} \times x_{\text{new}}
\]

### 3.4 When the Regression Is Used

- **Training**: Only if we have **at least 10** historical rows (completed appointments). Fewer → no model (return `null`).
- **Prediction**: Regression is used only if:
  1. A model was successfully trained, and  
  2. The appointment has a valid **queue position** (`my_position > 0`).

If both hold, we use the regression to predict **“average duration per appointment at this position”** and use that as `effectiveAvgDuration` when relevant. Otherwise we fall back to the **historical average duration** from metrics.

### 3.5 Confidence for Regression

- **HIGH**: Training data has **≥ 30** completed appointments.
- **MEDIUM**: Training data has **10–29** completed appointments.

So “more past data ⇒ higher confidence in the regression estimate.”

---

## 4. All Factors That Determine the Final Waiting Time

The final **predicted wait** is the sum of several components. Each factor is listed below.

| # | Factor | Source | Role |
|---|--------|--------|------|
| 1 | **Queue position** | Live queue for today | Determines “how many people ahead” and is the **X** in regression (when used). |
| 2 | **Historical average duration** | Metrics (same doctor/clinic/dept/type) | Default “time per appointment” when regression is not used; also used for current and ahead patients when they have no `estimated_duration`. |
| 3 | **Regression model** (optional) | Trained on completed appointments (same doctor/clinic/dept/type) | Gives a **position-dependent** duration estimate; used as `effectiveAvgDuration` when model exists and position is known. |
| 4 | **Remaining time of current patient** | Live queue: who is IN_PROGRESS + their `actual_start_time` and `estimated_duration` | If someone is currently with the doctor, we only count the **remaining** time until they finish, not their full duration. |
| 5 | **Number and type of patients ahead** | Live queue: list of appointments before this one (excluding current) | For each patient ahead we estimate their duration (by their type or default) and sum. |
| 6 | **No-show rate** | Metrics (same doctor/clinic/dept/type) | Reduces the estimated time for patients ahead: `adjusted = base × (1 - no_show_rate × 0.5)` so we don’t over-count people who might not show. |
| 7 | **Average start delay** | Metrics | Average minutes the doctor starts late relative to scheduled time; added once at the end. |

So in one sentence:  
**“Waiting time = (remaining time of current patient) + (sum of adjusted durations of everyone ahead) + (average start delay),”** where “duration” can come from regression (when applicable) or from historical averages.

---

## 5. Final Formula (Implemented Logic)

```
remaining_current_minutes = max(0, estimated_duration_of_current - elapsed_minutes)

For each patient ahead (excluding current):
  base = their estimated_duration OR metrics.avg_duration for their type
  adjusted = base × (1 - no_show_rate × 0.5)
  ahead_time += adjusted

predicted_wait = remaining_current_minutes + ahead_time + avg_start_delay
```

- **Regression** only changes what we use as “duration” when we need an average (e.g. for `effectiveAvgDuration` or when we don’t have a per-patient estimate). The **structure** of the formula above is the same with or without regression.

---

## 6. Confidence Levels (When We Say HIGH / MEDIUM / LOW)

| Condition | Confidence |
|-----------|------------|
| Regression used and training data ≥ 30 | **HIGH** |
| Regression used and training data 10–29 | **MEDIUM** |
| No regression but metrics sample size > 30 | **HIGH** |
| No regression but metrics sample size 10–30 | **MEDIUM** |
| Otherwise (small samples, no regression) | **LOW** |

So the algorithm is **transparent**: confidence is driven by how much historical data we have (and whether we could train a regression model).

---

## 7. Summary for Project Defense

- **Goal**: Estimate how long a patient will wait before their turn, using **today’s queue** and **historical behavior** of the same doctor/clinic/department/type.
- **Linear regression**: Models “consultation duration vs queue position” from **completed** appointments to improve estimates when we have enough data (≥10 samples).
- **Factors**: Queue position, current patient’s remaining time, count and type of patients ahead, no-show rate, average start delay, and (optionally) the regression-refined duration.
- **Output**: `predicted_wait_minutes`, `my_position`, `confidence`, and an `explanation` object (remaining_current_minutes, patients_ahead, avg_duration_used, base_avg_duration, avg_start_delay, no_show_rate, model_used: `"LINEAR_REGRESSION"` or `"AVERAGE"`).

You can use this document as the single source of truth for “how the waiting time prediction and linear regression algorithm work” in your project documentation and defense.
