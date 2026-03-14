// 管理员页面返回上一级功能
function goBack() {
  // 获取当前页面URL
  const currentUrl = window.location.href;
  
  // 检查是否有历史记录
  if (window.history.length > 1) {
    // 尝试返回上一页
    window.history.back();
  } else {
    // 如果没有历史记录，默认返回管理员首页
    window.location.href = '/admin';
  }
}

// 绑定返回按钮点击事件
function bindBackButton() {
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      goBack();
    });
  }
}

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
  bindBackButton();
});
