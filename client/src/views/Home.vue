<template>
  <div class="home">
    <div class="hero">
      <h1>家校问卷系统</h1>
      <p>通过问卷收集家长反馈，促进家校沟通</p>
    </div>

    <div class="features">
      <div class="card">
        <h3>简单易用</h3>
        <p>家长无需注册，输入姓名和学号即可参与问卷</p>
      </div>
      
      <div class="card">
        <h3>实时统计</h3>
        <p>管理员可以实时查看问卷提交情况和统计结果</p>
      </div>
      
      <div class="card">
        <h3>多种题型</h3>
        <p>支持星级评价和文本输入等多种问卷题型</p>
      </div>
    </div>

    <div class="actions">
      <router-link to="/admin" class="btn">管理后台</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home {
  text-align: center;
}

.hero {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.features .card {
  text-align: center;
}

.features h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.actions {
  padding: 2rem 0;
}
</style>