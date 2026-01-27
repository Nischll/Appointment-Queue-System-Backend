import {
  getAllModulesQuery,
  getModulesByROleQuery,
  getUserByIdQuery,
} from "../models/initModels.js";

// Recursively build module tree
const buildModuleTree = (modules, parentId = null) => {
  return modules
    .filter((m) => m.parent_id === parentId)
    .map((m) => ({
      name: m.name,
      icon: m.icon,
      path: m.path,
      code: m.code,
      moduleList: buildModuleTree(modules, m.id),
    }));
};

export const initService = async (userId) => {
  const user = await getUserByIdQuery(userId);
  if (!user) throw new Error("User not found");

  let modules = [];

  if (user.user_type === "EXTERNAL") {
    // Hardcode modules for external/patient users
    modules = [
      {
        id: 1,
        parent_id: null,
        orders: 1,
        name: "Dashboard",
        code: "D",
        description: "Dashboard",
        icon: "LayoutGrid",
        path: "/home",
      },
      // {
      //   id: 2,
      //   orders: 2,
      //   name: "Book Appointment",
      //   icon: "calendar",
      //   path: "/appointments",
      //   code: "",
      //   parent_id: null,
      // },
      {
        id: 3,
        orders: 3,
        name: "My Appointments",
        icon: "list",
        path: "/my-appointments",
        code: "MA",
        parent_id: null,
      },
      {
        id: 4,
        orders: 4,
        name: "Profile",
        icon: "user",
        path: "/profile",
        code: "P",
        parent_id: null,
      },
    ];
  } else if (user.code === "SUPERADMIN") {
    // Admin gets all modules
    modules = await getAllModulesQuery();
  } else {
    // Internal staff users get modules by role
    modules = await getModulesByROleQuery(user.role_name);
  }

  const moduleList = buildModuleTree(modules);

  return {
    userId: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    role: user.role_name || null,
    roleCode: user.code || null,
    isActive: user.isactive,
    moduleList,
  };
};
