# 高达·石墨主题设计

用户已选择低调黑灰方案，减少红色。目标为可安装到官方 DSH Desktop 的插件。

- 原始 PNG 完整保留，背景偏右居中，cover 适配窗口。
- 石墨黑面板、冷白正文、银灰强调，保留原图红色细节。
- Canvas2D 流场驱动粒子；鼠标推开网格节点，弹簧阻尼回弹。
- 原生 settings.general.item 设置页；通过宿主 configForms 保存，兼容 settingsScope。
- 视觉层 aria-hidden、pointer-events:none；只修改配色和背景，不改宿主布局尺寸、滚动、快捷键或输入逻辑。
- 默认 30 fps，DPR 上限 1.5；隐藏页面与 reduced-motion 停止动画。
- 卸载清理动画、事件、DOM、样式与主题 override。
