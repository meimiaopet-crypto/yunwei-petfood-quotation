-- 迁移 0002：为 quotations 表补充 selected_term_ids 列
-- 用途：持久化用户在「新建报价单」页勾选的条款模板，
--       使导出的 PDF / PI 仅渲染勾选的条款（而非全部默认条款）。
-- 执行方式：在 Supabase 控制台 → SQL Editor 中粘贴本文件并运行。
-- 注意：
--   1. 该列不存在时，客户端 data.quotations.save 会自动降级（剔除该字段）不报错；
--      但只有执行本迁移后，勾选数据才会真正写入，PDF 才会按勾选过滤。
--   2. 已存在的旧数据（无该列）在迁移后默认 selected_term_ids = '[]'，PDF 渲染全部条款（兼容）。

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS selected_term_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
