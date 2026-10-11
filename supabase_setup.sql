-- ============================================================
-- GDG NCTU HR Management Platform — Direct Database Access Script
-- نفذ هذا الكود في Supabase SQL Editor للبدء الفعلي المباشر
-- ============================================================

-- 1. منح التطبيق كافة الصلاحيات للقراءة والكتابة
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. إتاحة الوصول المباشر لجداول العمليات للربط الفعلي
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_assignees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluation_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS improvement_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appeals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
