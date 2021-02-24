const {createTimeCell} = require('./time_script/create')
const {updateTimeCell, getCurrentTimeIndexStateCell, getTimeInfoCell} = require('./time_script/update')
const {TIME_INFO_UPDATE_INTERVAL} = require('./time_script/time_info_script')
const {startHttpSvr} = require('./http_svr/http_svr')
const {TimeIndexStateTypeScript, TimeInfoTypeScript, saveConfig} = require('./utils/config')
const {logger} = require('./utils/log')
const {getNextTimeStamp} = require('./time_script/helper')

const startTimeSvr = async () => {
    logger.info("Time script generator server start")
    const {curTimeIndexStateCell, curTimeIndexState} = await getCurrentTimeIndexStateCell()
    if (!curTimeIndexStateCell) {
        //create time cell
        const {timeScriptArgs} = await createTimeCell()
        TimeIndexStateTypeScript.args = timeScriptArgs
        TimeInfoTypeScript.args = timeScriptArgs
        saveConfig(timeScriptArgs)
        setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
        return
    }

    //update time cell
    const {timeInfo: curTimeInfo} = await getTimeInfoCell(curTimeIndexState.getTimeIndex())
    const nextUpdateTime = getNextUpdateTime(curTimeInfo.getTimestamp())
    setTimeout(startUpdateTimeInfoCell, nextUpdateTime)
}

const getNextUpdateTime = (curUpdateTime) => {
    if (curUpdateTime === 0 ){
        return TIME_INFO_UPDATE_INTERVAL * 1000
    }
    let nextUpdateTime = curUpdateTime +TIME_INFO_UPDATE_INTERVAL - getNextTimeStamp()
    nextUpdateTime = nextUpdateTime < 0 ? 0 : nextUpdateTime
    return nextUpdateTime * 1000
}

const startUpdateTimeInfoCell = async () => {
    try {
        await updateTimeCell()
        setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL*1000)
    } catch (err) {
        logger.warn(err)
        setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL/2*1000)
    }
}

startHttpSvr()
startTimeSvr()
