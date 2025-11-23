import {
  getAllModulesQuery,
  getModulesByROleQuery,
  getUserByIdQuery,
} from "../models/initModels.js";

const buildModuleTree = (modules, parentId = null) => {
  return modules
    .filter((m) => m.parent_id === parentId)
    .map((m) => ({
      // appointmentCount: null,
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
  if (user.role_name === "admin") {
    // Admin gets all modules
    modules = await getAllModulesQuery();
  } else {
    // Other users get only their allowed modules
    modules = await getModulesByROleQuery(user.role_name);
  }
  const moduleList = buildModuleTree(modules);

  return {
    fullName: user.fullname,
    firstName: user.fullname.split(" ")[0] || "",
    middleName: user.fullname.split(" ")[1] || "",
    lastName: user.fullname.split(" ")[2] || "",
    email: user.email,
    role: user.role_name,
    isActive: user.isactive,
    moduleList,
  };
};
