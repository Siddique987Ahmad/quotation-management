const { prisma } = require('../config/database');

/**
 * Add a client to a department
 * @param {string} clientId - Client ID
 * @param {string} departmentId - Department ID
 * @returns {Object} Client department relationship
 */
const addClientToDepartment = async (clientId, departmentId) => {
  // Check if client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId }
  });

  if (!department) {
    throw new Error('Department not found');
  }

  // Check if relationship already exists
  const existingRelation = await prisma.clientDepartment.findUnique({
    where: {
      clientId_departmentId: {
        clientId,
        departmentId
      }
    }
  });

  if (existingRelation) {
    throw new Error('Client is already assigned to this department');
  }

  // Create the relationship
  const clientDepartment = await prisma.clientDepartment.create({
    data: {
      clientId,
      departmentId
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true
        }
      },
      department: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true
        }
      }
    }
  });

  return clientDepartment;
};

/**
 * Remove a client from a department
 * @param {string} clientId - Client ID
 * @param {string} departmentId - Department ID
 * @returns {Object} Success message
 */
const removeClientFromDepartment = async (clientId, departmentId) => {
  // Check if relationship exists
  const existingRelation = await prisma.clientDepartment.findUnique({
    where: {
      clientId_departmentId: {
        clientId,
        departmentId
      }
    }
  });

  if (!existingRelation) {
    throw new Error('Client is not assigned to this department');
  }

  // Remove the relationship
  await prisma.clientDepartment.delete({
    where: {
      clientId_departmentId: {
        clientId,
        departmentId
      }
    }
  });

  return { message: 'Client removed from department successfully' };
};

/**
 * Get all departments for a client
 * @param {string} clientId - Client ID
 * @returns {Array} Array of departments
 */
const getClientDepartments = async (clientId) => {
  const clientDepartments = await prisma.clientDepartment.findMany({
    where: { clientId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true
        }
      }
    }
  });

  return clientDepartments.map(cd => cd.department);
};

/**
 * Get all clients for a department
 * @param {string} departmentId - Department ID
 * @returns {Array} Array of clients
 */
const getDepartmentClients = async (departmentId) => {
  const departmentClients = await prisma.clientDepartment.findMany({
    where: { departmentId },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          isActive: true
        }
      }
    }
  });

  return departmentClients.map(dc => dc.client);
};

/**
 * Update client departments (replace all with new list)
 * @param {string} clientId - Client ID
 * @param {Array} departmentIds - Array of department IDs
 * @returns {Array} Updated departments
 */
const updateClientDepartments = async (clientId, departmentIds) => {
  // Validate all departments exist
  const departments = await prisma.department.findMany({
    where: {
      id: {
        in: departmentIds
      }
    }
  });

  if (departments.length !== departmentIds.length) {
    throw new Error('One or more departments not found');
  }

  // Remove all existing relationships
  await prisma.clientDepartment.deleteMany({
    where: { clientId }
  });

  // Create new relationships
  if (departmentIds.length > 0) {
    await prisma.clientDepartment.createMany({
      data: departmentIds.map(departmentId => ({
        clientId,
        departmentId
      }))
    });
  }

  // Return updated departments
  return await getClientDepartments(clientId);
};

/**
 * Check if client is assigned to department
 * @param {string} clientId - Client ID
 * @param {string} departmentId - Department ID
 * @returns {boolean} True if assigned
 */
const isClientInDepartment = async (clientId, departmentId) => {
  const relation = await prisma.clientDepartment.findUnique({
    where: {
      clientId_departmentId: {
        clientId,
        departmentId
      }
    }
  });

  return !!relation;
};

module.exports = {
  addClientToDepartment,
  removeClientFromDepartment,
  getClientDepartments,
  getDepartmentClients,
  updateClientDepartments,
  isClientInDepartment
};
