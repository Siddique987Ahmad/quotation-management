const { prisma } = require('../config/database');

async function listTerms() {
  return prisma.quotationTerm.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
}

async function listActiveTerms() {
  return prisma.quotationTerm.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
}

async function createTerm(data) {
  const nextOrder = (await prisma.quotationTerm.count()) + 1;
  return prisma.quotationTerm.create({
    data: { label: data.label, value: data.value, highlight: !!data.highlight, active: data.active !== false, sortOrder: data.sortOrder ?? nextOrder }
  });
}

async function updateTerm(id, data) {
  return prisma.quotationTerm.update({ where: { id }, data });
}

async function deleteTerm(id) {
  return prisma.quotationTerm.delete({ where: { id } });
}

async function reorderTerms(order) {
  // order: [{id, sortOrder}, ...]
  const tx = order.map(item => prisma.quotationTerm.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }));
  await prisma.$transaction(tx);
  return listTerms();
}

module.exports = { listTerms, listActiveTerms, createTerm, updateTerm, deleteTerm, reorderTerms };


