import { ipcMain } from "electron";
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg-static");
const path = require("path");
const exec = require("child_process").exec;

var vidList = [];


if (require("os").platform() === "win32") {
  const pathToDownloads = `${process.env.HOME}\\Downloads`;
  var pathToAll = `${pathToDownloads}\\YTvideo\\`;
  var pathToMerged = `${pathToAll}\\YTvideoMerged/`;
} else {
  const pathToDownloads = `${process.env.HOME}/Downloads`;
  var pathToAll = `${pathToDownloads}/YTvideo/`;
  var pathToMerged = `${pathToAll}/YTvideoMerged/`;
}

if (!fs.existsSync("intermediate")) {
  fs.mkdirSync("intermediate");
}

async function mergeVideos(e, inputVideos, pathToMerged) {
  if (!fs.existsSync(pathToMerged)) {
    fs.mkdirSync(pathToMerged);
  }
  var res = {};
  var ffmpeger = "";
  ffmpeger = inputVideos
    .map(
      (video) =>
        `${ffmpeg} -y -i ${video} -c copy -bsf:v h264_mp4toannexb -f mpegts intermediate/${
          path.parse(video).name
        }.ts `
    )
    .join("&&");
  var concatenator = '"concat:';
  concatenator += inputVideos
    .map((video) => `intermediate/${path.parse(video).name}.ts`)
    .join("|");
  concatenator += '"';
  var outputName = inputVideos.map((video) => path.parse(video).name).join("+");
  var mergecmd = `${ffmpeg} -y -i ${concatenator} -c copy -bsf:a aac_adtstoasc ${pathToMerged}${outputName}.mp4`;
  exec(`${ffmpeger} && ${mergecmd}`, (err, stdout, stderr) => {
    res.error = err ? true : false;
    res.downloaded = true;
    res.msg = res.error
      ? "Downloaded Successfully. Error while merging"
      : "Download and Merge Successful";
    e.sender.send("download-process", res);
  });
}

function downloadAll(e, urlList, performMerge) {
  var videoList = [];
  var downloadComplete = 0;
  urlList.forEach((item) => {
    let url = item[0];
    let videoPath = item[1];
    videoList[url] = ytdl(url);
    videoList[url].pipe(fs.createWriteStream(videoPath));
    videoList[url].on("progress", (chunkLength, downloaded, total) => {
      e.sender.send("downloading", [downloaded, total]);
    });
    videoList[url].on("end", () => {
      downloadComplete++;
      if (downloadComplete === urlList.length) {
        if (performMerge) {
          mergeVideos(e, vidList, pathToMerged);
        } else {
          e.sender.send("download-process", {
            error: false,
            downloaded: true,
            msg: `Downloaded ${downloadComplete} videos successfuly`,
          });
        }
      }
    });
  });
}

ipcMain.on("download-all", (e, data) => {
  if (!fs.existsSync(pathToAll)) {
    fs.mkdirSync(pathToAll);
  }
  vidList = [];
  var cleanUrlList = data.urlList
    .map((url) => {
      var videoId = ytdl.getURLVideoID(url);
      var videoPath = pathToAll + `${videoId}.mp4`;
      vidList.push(videoPath);
      if (!fs.existsSync(videoPath)) {
        return [url, videoPath];
      }
    })
    .filter((item) => !!item);

  if (cleanUrlList.length === 0) {
    e.sender.send("download-process", {
      error: false,
      downloaded: false,
      msg: data.merge
        ? "Videos already downloaded. No merge performed"
        : "Videos already downloaded",
    });
  } else {
    downloadAll(e, cleanUrlList, data.merge);
  }
});
