const {createTimeCell} = require('./time_script/create')
const {updateTimeCell, getCurrentTimeIndexStateCell, getTimeInfoCell} = require('./time_script/update')
const {TIME_INFO_UPDATE_INTERVAL} = require('./time_script/time_info_script')
const {startHttpSvr} = require('./http_svr/http_svr')
const {TimeIndexStateTypeScript, TimeInfoTypeScript, saveConfig} = require('./utils/config')

const startTimeSvr = async () => {
    console.info("CKB Time server start")
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
    console.info(`CurrentTimeIndex:${curTimeInfo.getTimeIndex()} CurrentTimestamp:${curTimeInfo.getTimestamp()}`)

    const curTimestamp = Math.floor(new Date().getTime() / 1000)
    let nextUpdateTime = curTimeInfo.getTimestamp() + TIME_INFO_UPDATE_INTERVAL - curTimestamp
    if (nextUpdateTime < 0) {
        nextUpdateTime = 0
    }

    console.info(`Next time info cell update in ${nextUpdateTime} seconds`)
    setTimeout(startUpdateTimeInfoCell, nextUpdateTime * 1000)
}

const startUpdateTimeInfoCell = async () => {
    try {
        await updateTimeCell()
    } catch (e) {
        console.error(e)
        setTimeout(startUpdateTimeInfoCell, 10 * 1000) //retry after 10 seconds
        return
    }
    setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
}

startHttpSvr()
startTimeSvr()
