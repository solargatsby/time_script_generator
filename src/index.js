const {createTimeCell} = require('./time_script/create')
const {updateTimeCell, getCurrentTimeIndexStateCell, getTimeInfoCell} = require('./time_script/update')
const {TIME_INFO_UPDATE_INTERVAL} = require('./time_script/time_info_script')
const {TIME_INDEX_CELL_DATA_N} = require('./time_script/time_index_state_script')
const {startHttpSvr} = require('./http_svr/http_svr')
const {TimeIndexStateTypeScript, TimeInfoTypeScript, saveConfig} = require('./utils/config')
const {logger} = require('./utils/log')

const startTimeSvr = async () => {
    logger.info("Time script generator server start")
    const {curTimeIndexStateCell, curTimeIndexState} = await getCurrentTimeIndexStateCell()
    if (!curTimeIndexStateCell) {
        //create time cell
        const {timeScriptArgs} = await createTimeCell()
        TimeIndexStateTypeScript.args = timeScriptArgs
        TimeInfoTypeScript.args = timeScriptArgs
        saveConfig(timeScriptArgs)
        logger.info(`Next time info cell update in ${TIME_INFO_UPDATE_INTERVAL} seconds`)
        setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
        return
    }

    //update time cell
    const {timeInfo: curTimeInfo} = await  getTimeInfoCell(curTimeIndexState.getTimeIndex())
    const {timeInfo: preTimeInfo} = await  getTimeInfoCell(curTimeIndexState.incrIndex().getTimeIndex())
    const preUpdateTime = preTimeInfo ? preTimeInfo.getTimestamp() : 0
    const nextUpdateTime = getNextUpdateTime(preUpdateTime, curTimeInfo.getTimestamp())
    logger.info(`Next time info cell update in ${nextUpdateTime/1000} seconds`)
    setTimeout(startUpdateTimeInfoCell, nextUpdateTime)
}

const getNextUpdateTime = (preUpdateTime, curUpdateTime) => {
    const curTimestamp = Math.floor(new Date().getTime() / 1000)
    let preUpdateTimeBase = curUpdateTime + TIME_INFO_UPDATE_INTERVAL - curTimestamp
    preUpdateTimeBase = preUpdateTimeBase < 0 ? 0: preUpdateTimeBase
    if (preUpdateTime === 0){
        return preUpdateTimeBase * 1000
    }
    const since = preUpdateTime + TIME_INDEX_CELL_DATA_N * TIME_INFO_UPDATE_INTERVAL
    let nextUpdateTime = since - curTimestamp
    if (nextUpdateTime < 0) {
        nextUpdateTime = 0
    }
    nextUpdateTime = nextUpdateTime > preUpdateTimeBase ? nextUpdateTime : preUpdateTimeBase
    return nextUpdateTime * 1000
}

const startUpdateTimeInfoCell = async () => {
    try {
        const {TimeIndexState: timeIndexState, TimeInfo: timeInfo} = await updateTimeCell()
        const {timeInfo: preTimeInfo} = await getTimeInfoCell(timeIndexState.incrIndex().getTimeIndex())
        const preUpdateTime = preTimeInfo ? preTimeInfo.getTimestamp() : 0
        const nextUpdateTime = getNextUpdateTime(preUpdateTime, timeInfo.getTimestamp())
        logger.info(`Next time info cell update in ${nextUpdateTime/1000} seconds`)
        setTimeout(startUpdateTimeInfoCell, nextUpdateTime)
    } catch (err) {
        logger.error(err)
        setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000) //retry
    }
}

startHttpSvr()
startTimeSvr()
