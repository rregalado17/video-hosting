import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import ffmpeg from "fluent-ffmpeg"
import { resolve } from "path";

const storage = new Storage()

const rawVideoBucketName = "rr-raw-video-hosting";
const processedVideoBucketName = "rr-processed-video=hosting";

const localRawVideoPath = "./raw-vids";
const localProcessedVideoPath = "./processed-vids";

export function setupDirectories() {
     
}

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
          console.log("Video processed.")
        })
        .on("error", (err) => {
          console.log(`An error occurred: ${err.message}`);
    
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    })
}

export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` });

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    )
}

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName)

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName
    })
    console.log(
        `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
    )
    await bucket.file(fileName).makePublic()
}

export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err)
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            }) 
        } else {
            console.log(`File  not found at ${filePath}, skipping the delete.`);
            resolve();
        }
    })
}