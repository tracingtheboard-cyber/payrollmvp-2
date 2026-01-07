# 修复 payslip_detail_view 的步骤

## 最简单的方法：使用 crews_current

1. **查看当前视图定义**：
   ```sql
   SELECT pg_get_viewdef('payslip_detail_view', true);
   ```

2. **复制视图定义，然后做以下修改**：
   - 找到所有的 `FROM crews c` 或 `FROM crews`
   - 替换为 `FROM crews_current c` 或 `FROM crews_current`
   - 其他所有内容保持不变

3. **重新创建视图**：
   ```sql
   DROP VIEW IF EXISTS payslip_detail_view CASCADE;
   
   CREATE OR REPLACE VIEW payslip_detail_view AS
   -- 粘贴修改后的视图定义
   ```

4. **好处**：
   - `c.basic_salary` 会自动从 `crew_compensation` 读取
   - 不需要修改字段名
   - 不需要修改前端代码

## 示例

**原来：**
```sql
FROM crews c
```

**改成：**
```sql
FROM crews_current c
```

然后 `c.basic_salary` 就可以正常使用了！






