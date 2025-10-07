<template>
  <div class="loading-wrapper">
    <div class="mask"></div>
    <img src="../assets/images/loading.gif" alt="載入中..." class="loading-gif" />
  </div>
</template>

<style scoped>
.loading-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
}

.loading-gif {
  position: relative;
  width: 100px; /* 改小尺寸 */
  height: auto;
  border-radius: 16px;
  z-index: 10000;
}
</style>
