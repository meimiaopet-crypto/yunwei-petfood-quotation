-- 可选迁移：为 quotations 表补充 selected_term_ids 列
-- 用途：持久化用户在「新建报价单」页勾选的条款模板，便于后续 PDF 仅渲染勾选项
-- 当前客户端 save() 已自动剔除该字段（quotations 表无此列也能正常保存）。
-- 若希望启用「按勾选条款导出 PDF」，请在 Supabase SQL Editor 执行本文件，
-- 并改回 data.quotations.save 发送 selected_term_ids（同时让 PDF route 按它过滤 terms）。

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS selected_term_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
