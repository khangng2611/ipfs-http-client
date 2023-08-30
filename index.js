const ipfsClient = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const ipfs = ipfsClient.create({
    host: '127.0.0.1',
    port: '5001',
    protocol: 'http'
});

app.use(bodyParser.urlencoded({extended : true}));
app.use( bodyParser.json() );
app.use(fileUpload());

app.get('/', (req,res) => {
    res.json('null');
});

app.post('/upload', (req, res) => {
    if (req.files == null) {
        error = 'No files to upload !';
        res.status(500).send({error});
    }
    else {
        const images = (req.files.image.length >= 2) ? req.files.image : [req.files.image];
        console.log(images);
        const hashes = [];
        const promises = [];
        for (const image of images) {
            const name = image.name;
            const filePath = 'files/' + name;
            const promise = new Promise((resolve, reject) => {
                image.mv(filePath, async (err) => {
                    if (err) {
                        console.log("Fail to download file !");
                        reject(err);
                    }
                    const hash = await addFile(name, filePath);
                    fs.unlink(filePath, (err) => {
                        if (err) console.log(err);
                        reject(err);
                    })
                    const url = "http://127.0.0.1:8080/ipfs/" + hash;
                    hashes.push({'name' : name, 'hash' : hash, 'url' : url});
                    resolve();
                });
            });
            promises.push(promise);
        }
        Promise.all(promises)
            .then(() => {
                res.send(hashes);
            })
            .catch((error) => {
                res.status(500).send({error});
            });
    }
});

app.get('/get/:cid', (req, res) => {
    const hash = req.params.cid;
    const link = "http://127.0.0.1:8080/ipfs/" + hash;
    res.redirect(link);
});

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const filedAdded = await ipfs.add({
        path: fileName,
        content: file
    });
    const fileHash = filedAdded.cid.toString();
    return fileHash;
}



app.listen(3000, () => {
    console.log("Listen on 3000");
})