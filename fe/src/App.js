import "./App.css";
import axios from "axios";
import React, { useState, useRef, useMemo, useEffect } from "react";

const SIZE = 1024 * 1024; // 文件块的大小

function App() {
  const [file, setFile] = useState(0);
  const [fileBase64, setFileBase64] = useState("");
  const [uploadNum, setUploadNum] = useState(0);
  const [chunks, setChunks] = useState([]); // 所有分块
  const chunkCount = useMemo(() => Math.ceil(file?.size / SIZE), [file.size]);
  const hashRef = useRef(Date.now().toString());
  const isPause = useRef(true); // 是否暂停

  useEffect(() => {
    setUploadNum(0);
    setChunks([]);
    isPause.current = true;
  }, [file]);

  useEffect(() => {
    const fileChunks = [];
    for (let i = 0; i <= chunkCount; i++) {
      const start = i * SIZE;
      const end = start + SIZE;
      const chunk = file.slice(start, end); // 拆分文件
      fileChunks.push(chunk);
    }
    setChunks(fileChunks);
  }, [chunkCount]);

  const handleFileChange = (e) => {
    console.log("file", e.target.files[0]);
    fileToBase64(e.target.files[0], (base64) => {
      setFileBase64(base64);
    });
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    isPause.current = false;
    console.log("chunks", chunks);
    for (let i = uploadNum; i < chunks.length; i++) {
      // formData 用于发送文件或二进制数据
      const formData = new FormData();
      formData.append("file", chunks[i]);
      formData.append("index", i);
      formData.append("hash", hashRef.current);
      // formData.append("fileBase64", fileBase64);
      try {
        await axios.post("http://localhost:3000/upload", formData);
        setUploadNum(i);
        if (isPause.current) {
          console.log("pause");
          break;
        }
      } catch {
        break;
      } finally {
      }
    }
  };

  useEffect(() => {
    if (uploadNum && uploadNum + 1 == chunks.length) {
      axios
        .post("http://localhost:3000/merge", {
          type: "merge",
          filename: file.name,
          hash: hashRef.current,
        })
        .then(({ data }) => {
          console.log(data);
        });
    }
  }, [uploadNum, chunks.length, file.name]);

  const handlePause = () => {
    isPause.current = true;
  };

  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      callback(reader.result);
    });
    reader.readAsDataURL(file);
  };

  return (
    <div className="App" style={{ marginTop: 200 }}>
      <input type="file" onChange={handleFileChange} />
      <button
        disabled={!file}
        onClick={isPause.current ? handleUpload : handlePause}
      >
        {isPause.current
          ? uploadNum > 0
            ? "暂停"
            : "上传"
          : uploadNum >= chunkCount
          ? "上传完成"
          : "继续"}
      </button>
      <h2>
        上传进度为：
        <br />
        {uploadNum * SIZE} / {file?.size}
        <br />
        {(((uploadNum * SIZE) / file?.size || 0) * 100).toFixed(2)} %
      </h2>
    </div>
  );
}

export default App;
