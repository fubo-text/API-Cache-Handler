import { useState } from "react";

function App() {
  const [text,setText] = useState('')
  const handleClick = () => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/api/data", true);

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 请求成功
        // document.getElementById("xhrData").textContent = xhr.responseText;
        setText(xhr.responseText)
      } else {
        // 处理错误
        console.error("The request failed!");
      }
      console.log(xhr.responseText, "11");
    };

    xhr.onerror = function() {
      // 处理请求过程中发生的错误
      console.error("The request failed!");
    };

    xhr.send();
  };
  return (
    <div className="App">
      <button onClick={handleClick}>点击</button>
      {text}
    </div>
  );
}

export default App;
