<template>
  <div class="main-container">
    <!-- 功能按钮侧边栏 -->
    <div class="poetry-sidebar">
      <button @click="handleInitialize" class="load-btn">初始化</button>
      
      <!-- 新增输入框区域 -->
      <input v-model="roomName" placeholder="请输入房间名" class="sidebar-input">
      <input v-model="userId" placeholder="请输入uid" class="sidebar-input">

      <button @click="handleJoinRoom" class="load-btn">加入房间</button>
      <button @click="handleToggleVideo" class="load-btn">开关视频</button>
      <button @click="handleLeaveRoom" class="load-btn">离开房间</button>
    </div>

    <!-- 右侧双色块容器 -->
    <div class="container">
      <div class="color-block1" id="local-container"></div>
      <div class="color-block2" id="remote-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import NERTC from 'nertc-web-sdk'

// 新增输入框绑定数据
const roomName = ref('')
const userId = ref('')

const rtc = reactive({
  client: null
})

// 新增功能方法
function handleInitialize() {
  console.log('执行初始化操作')
  //创建 client 实例
  rtc.client = NERTC.createClient({
    appkey: '4727023efa991d31d61b3b32e819bd5b', //您的 App Key
    debug: true, //是否开启调试日志
  });

}

function handleJoinRoom() {
  console.log('加入房间操作')

    //加入房间
  rtc.client.join({
      channelName: roomName.value,
      uid: userId.value,
      token: '' //调试模式下可设置为 null。正式上线前设置为相应的 Token，具体请参考 "Token 鉴权" 章节。
  }).then((obj) => {
      console.info('加入房间成功...')
      initLocalStream()
  })

  rtc.client.on('peer-online', evt => {
    console.log(`${evt.uid} 加入房间`)
  })

  rtc.client.on('stream-added', evt => {
    var remoteStream = evt.stream;
    console.log('收到别人的发布消息: ', remoteStream.streamID, 'mediaType: ', evt.mediaType)

    //设置要订阅音频或者视频
    remoteStream.setSubscribeConfig({
        audio: true,//订阅麦克风音频
        audioSlave: true,//订阅音频辅流
        video: true,//订阅视频
        screenShare: true,//订阅屏幕共享
        highOrLow: NERTC.STREAM_TYPE.HIGH,//订阅大流
    })
    //发起订阅
    rtc.client.subscribe(remoteStream).then(()=>{
        console.log('发起订阅对端成功')
    })  
  })

    //播放订阅的对端的音视频流
  rtc.client.on('stream-subscribed', evt => {
      console.warn('订阅别人的流成功的通知')
      var remoteStream = evt.stream;
      let div = document.getElementById('remote-container')
      const containerWidth = div.clientWidth;  // 获取容器实际宽度
      const containerHeight = div.clientHeight;  // 获取容器实际高度
      //开始播放远端音视频流
      remoteStream.play(div).then(()=>{
        console.log('播放对端的流成功')
        remoteStream.setRemoteRenderMode({
          width: containerWidth,
          height: containerHeight,
          cut: true
        })
      })
  })

}

//初始化本地流并且发布
async function initLocalStream() {
  const cameras = await NERTC.getCameras();
  const microphones = await NERTC.getMicrophones();
  
  rtc.localStream = NERTC.createStream({
      uid: userId.value,
      audio: true,
      microphoneId: microphones[0]?.deviceId,
      video: false,
      cameraId: cameras[0]?.deviceId
  });

  rtc.localStream.init().then(()=>{
      let div = document.getElementById('local-container');
      const containerWidth = div.clientWidth;  // 获取容器实际宽度
      const containerHeight = div.clientHeight;  // 获取容器实际高度
      
      rtc.localStream.play(div);
      rtc.localStream.setLocalRenderMode({
          width: containerWidth,  // 使用容器实际宽度
          height: containerHeight, // 保持原有高度设置
          cut: true
      });

      // 将本地音视频流发布至网易云信服务器，加入房间前不用执行此方法。
      rtc.client.publish(rtc.localStream).then(()=>{
        console.warn('本地 publish 成功')
      })
  })
}

async function handleToggleVideo() {
  if (rtc.localStream.isPlaying('video')) {
    console.log('=== 关闭视频')
    rtc.localStream.close({ type: "video"})
  } else {
    console.log('=== 打开视频')
    await rtc.localStream.open({ type: "video"})
    let div = document.getElementById('local-container');
    const containerWidth = div.clientWidth;  // 获取容器实际宽度
    const containerHeight = div.clientHeight;  // 获取容器实际高度
    rtc.localStream.play(div);
    rtc.localStream.setLocalRenderMode({
          width: containerWidth,  // 使用容器实际宽度
          height: containerHeight, // 保持原有高度设置
          cut: true
    });
  }
}

function handleLeaveRoom() {
   rtc.client.leave()
   rtc.localStream.stop()
}
</script>

<style scoped>
/* 在原有样式基础上新增输入框样式 */
.sidebar-input {
  width: 90%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.sidebar-input::placeholder {
  color: #95a5a6;
}
.main-container {
  display: flex;
  min-height: 100vh;
  /* 新增排列方向 */
  flex-direction: row;
  gap: 20px;
}

.poetry-sidebar {
  width: 15%;
  height: 300px;
  background: #f8f9fa;
  padding: 20px;
  border-right: 1px solid #eee;
}

.poem-item {
  margin: 15px 0;
  padding: 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.poem-content {
  font-size: 1.1em;
  line-height: 1.6;
  color: #2c3e50;
}

.poem-meta {
  margin-top: 8px;
  text-align: right;
  font-size: 0.9em;
  color: #95a5a6;
}

.load-btn {
  width: 100%;
  padding: 8px;
  margin-top: 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.load-btn:hover {
  background: #2980b9;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  /* flex-direction: row; */
}

.color-block1,
.color-block2 {
  width: 80%;
  max-width: 300px;
  aspect-ratio: 1/1; /* 宽高比9:16 */
  border-radius: 8px;
}

.color-block1 {
  background: #ff6b6b; /* 珊瑚红色块 */
}

.color-block2 {
  background: #4ecdc4; /* 蓝绿色块 */
}
</style>