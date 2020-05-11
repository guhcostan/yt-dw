var express = require('express')
const DownloadYTFile = require('yt-dl-playlist');
var fs = require('fs');
var AdmZip = require('adm-zip');

const app = express();
let zipsId = 0
const downloader = new DownloadYTFile({
    outputPath: process.cwd() + "/videos",
    ffmpegPath: '/usr/bin/ffmpeg',
    maxParallelDownload: 10,
    fileNameGenerator: (videoTitle) => {
        return videoTitle + '.mp3'
    }
})

downloader.on('progress', (fileInfo) => console.log(fileInfo))

app.listen(4000, () => {
});

app.get('/download', (req, res) => {
    var URL = req.query.URL;
    downloader.download(URL).then(video => {
        var readStream = fs.createReadStream(video.filePath);
        readStream.on('open', function () {
            res.header('Content-Disposition', 'attachment; filename="' + video.fileName + '"');
            readStream.pipe(res);
            deleteFile(video.filePath);
        });
    })
});

function deleteFile (file) {
    fs.unlink(file, function (err) {
        if (err) {
            console.error(err.toString());
        } else {
            console.warn(file + ' deleted');
        }
    });
}


app.get('/downloadPlaylist', (req, res) => {
    var URL = req.query.URL;
    var zip = new AdmZip();
    downloader.downloadPlaylist(URL).then(videoArray => {
        videoArray.forEach((video) => {
            zip.addLocalFile(video.filePath)
            deleteFile(video.filePath);
        })
        zip.writeZip(zipsId + '.zip');

        var readStream = fs.createReadStream(zipsId + '.zip');
        readStream.on('open', function () {
            var readStream = fs.createReadStream(zipsId + '.zip');
            res.header('Content-Disposition', 'attachment; filename="playlist.zip"');
            readStream.pipe(res);
            deleteFile(zipsId + '.zip');
        });
    })
});

