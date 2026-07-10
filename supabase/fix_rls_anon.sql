-- =====================================================================
-- 修复 RLS：放开 anon 角色读取权限
-- 原因：原策略只允许 authenticated 读，anon key 查询返回空
-- =====================================================================

-- 1) 给所有表添加 anon 读权限
CREATE POLICY "anon read"  ON products            FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON product_tier_prices FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON customers           FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON company_profile     FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON terms_templates     FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON rate_configs        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON product_categories  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON quotation_items     FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON quotation_followups FOR SELECT TO anon USING (true);
CREATE POLICY "anon read"  ON quotations          FOR SELECT TO anon USING (true);

-- 2) 暂时允许 anon 写入（演示用，生产应改为 authenticated + 应用层权限）
CREATE POLICY "anon write" ON products           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON product_tier_prices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON customers          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON terms_templates    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON rate_configs       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON product_categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON quotation_items    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON quotation_followups FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON quotations         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write" ON company_profile    FOR ALL TO anon USING (true) WITH CHECK (true);
