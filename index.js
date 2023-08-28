const ipfsClient = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const ipfs = ipfsClient.create({
    host: '172.21.17.163:5001/api/v0/add',
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
    const image = req.files.image;
    const name = "temp-name";

    const filePath = 'files/' + name;
    image.mv(filePath, async (err) => {
        if (err) {
            console.log("Fail to download file !");
            return res.status(500).send(err);
        }
        const hash = await addFile(name, filePath);
        const image_url = "http://172.21.17.163:8080/ipfs/" + hash;
        fs.unlink(filePath, (err) => {
            if (err) console.log(err);
        })
        res.send({image_url});
    });
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