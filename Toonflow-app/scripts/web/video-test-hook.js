(function () {
  var TEST_BUTTON_ID = "jimeng-video-test-btn";
  var SAVE_TEXT = "保存";
  var CANCEL_TEXT = "取消";
  var HOOK_ATTR = "data-video-test-hooked";

  function getBaseOrigin() {
    var qs = new URLSearchParams(window.location.search);
    return qs.get("baseUrl") || window.location.origin;
  }

  function showMessage(message, type) {
    type = type || "info";
    if (window.$message && typeof window.$message[type] === "function") {
      window.$message[type](message);
      return;
    }
    window.alert(message);
  }

  function readInputValues(root) {
    return Array.from(root.querySelectorAll("input, textarea"))
      .map(function (input) {
        return (input.value && input.value.trim && input.value.trim()) || "";
      })
      .filter(Boolean);
  }

  function findVideoConfigDialog() {
    var dialogs = Array.from(document.querySelectorAll(".t-dialog, [role='dialog']"));
    return dialogs.find(function (dialog) {
      if (dialog.getAttribute(HOOK_ATTR) === "1") return false;
      var buttons = Array.from(dialog.querySelectorAll("button"));
      var hasSave = buttons.some(function (btn) {
        return btn.textContent && btn.textContent.trim() === SAVE_TEXT;
      });
      var hasCancel = buttons.some(function (btn) {
        return btn.textContent && btn.textContent.trim() === CANCEL_TEXT;
      });
      var inputCount = dialog.querySelectorAll("input, textarea").length;
      return hasSave && hasCancel && inputCount >= 3;
    });
  }

  async function testConnection(dialog, button) {
    var values = readInputValues(dialog);
    var modelName = values[0] || "";
    var baseURL = values[1] || "";
    var apiKey = values[2] || "";

    if (!modelName || !baseURL || !apiKey) {
      showMessage("请先填写完整的视频模型配置", "warning");
      return;
    }

    button.disabled = true;
    button.textContent = "测试中...";

    try {
      var token = localStorage.getItem("token") || "";
      var response = await fetch(getBaseOrigin() + "/video/testVideoModel", {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json" },
          token ? { Authorization: "Bearer " + token } : {}
        ),
        body: JSON.stringify({
          modelName: modelName,
          apiKey: apiKey,
          baseURL: baseURL,
          manufacturer: "jimeng",
        }),
      });

      var result;
      try {
        result = await response.json();
      } catch (e) {
        result = { code: 400, message: "测试接口返回了非 JSON 响应" };
      }

      if (!response.ok || result.code !== 200) {
        throw new Error(result.message || "测试失败");
      }

      showMessage("视频模型测试连接成功", "success");
    } catch (error) {
      showMessage((error && error.message) || "视频模型测试失败", "error");
    } finally {
      button.disabled = false;
      button.textContent = "测试连接";
    }
  }

  function mountTestButton() {
    var dialog = findVideoConfigDialog();
    if (!dialog || dialog.querySelector("#" + TEST_BUTTON_ID)) return;

    var buttons = Array.from(dialog.querySelectorAll("button"));
    var saveButton = buttons.find(function (btn) {
      return btn.textContent && btn.textContent.trim() === SAVE_TEXT;
    });
    if (!saveButton) return;

    dialog.setAttribute(HOOK_ATTR, "1");

    var testButton = document.createElement("button");
    testButton.id = TEST_BUTTON_ID;
    testButton.type = "button";
    testButton.className = saveButton.className;
    testButton.style.marginRight = "8px";
    testButton.textContent = "测试连接";
    testButton.addEventListener("click", function () {
      testConnection(dialog, testButton);
    });

    if (saveButton.parentElement) {
      saveButton.parentElement.insertBefore(testButton, saveButton);
    }
  }

  function boot() {
    mountTestButton();
    setTimeout(mountTestButton, 300);
    setTimeout(mountTestButton, 1000);
    setTimeout(mountTestButton, 2000);
  }

  var observer = new MutationObserver(function () {
    boot();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("load", function () {
    boot();
  });
})();
