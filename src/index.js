const { createTimeCell } = require('./rpc/create')
const { updateTimeCell } = require('./rpc/update')
const doCreateTimeCell = async () => {
  await createTimeCell()
  console.log("complete doCreateTimeCell")
}

const doUpdateTimeCell = async  () => {
  await updateTimeCell()
  console.log("complete doUpdateTimeCell")
}

// doCreateTimeCell()
doUpdateTimeCell()
