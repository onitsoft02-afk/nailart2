-- ==============================================================================
-- 001_create_profiles_table.sql
-- 
-- 설명: Supabase 공식 문서(Managing User Data) 기반 profiles 테이블 생성 스크립트
-- 기능:
--   1. 유저 권한 ENUM 타입 (Admin, User, NULL 지원)
--   2. auth.users 연동 profiles 테이블 생성
--   3. 강력한 Row Level Security (RLS) 보안 정책
--   4. 신규 유저 가입 시 자동 프로필 생성 트리거 (auth.users -> public.profiles)
--   5. 프로필 수정 시 updated_at 자동 갱신 트리거
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 유저 권한(Role) ENUM 타입 생성
-- ------------------------------------------------------------------------------
-- 'Admin', 'User' 두 가지 값을 정의합니다.
-- 컬럼 정의 시 NULL을 허용하므로, 사용자는 [Admin, User, NULL] 중 하나를 자유롭게 선택할 수 있습니다.
-- Supabase 대시보드(Table Editor)에서 드롭다운으로 편리하게 선택할 수 있습니다.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('Admin', 'User');
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. public.profiles 테이블 생성
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  -- auth.users의 id(UUID)를 기본키 및 외래키로 참조 (유저 탈퇴 시 자동 삭제 cascade)
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 사용자 이메일 (auth.users에서 자동 복사)
  email TEXT,
  
  -- 사용자 이름 / 닉네임 (소셜 로그인 메타데이터에서 자동 복사)
  full_name TEXT,
  
  -- 프로필 이미지 URL (구글/카카오 프로필 사진)
  avatar_url TEXT,
  
  -- 유저 권한: Admin, User, 또는 NULL 선택 가능 (기본값: 'User')
  role public.user_role DEFAULT 'User',
  
  -- 계정 생성 일시 및 수정 일시 (UTC 기준)
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  PRIMARY KEY (id)
);


-- ------------------------------------------------------------------------------
-- 3. 테이블 권한 부여 (Grant Privileges)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. RLS (Row Level Security) 활성화 및 보안 정책 (Security Policies)
-- ------------------------------------------------------------------------------
-- 보안을 위해 모든 데이터 접근은 정의된 RLS 정책을 통해서만 허용됩니다.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [보안 정책 1: 조회 (SELECT)]
-- 모든 사용자가 다른 사용자의 공개 프로필(이름, 아바타 등)을 조회할 수 있도록 허용합니다.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- [보안 정책 2: 수정 (UPDATE) - 일반 사용자]
-- 사용자는 '본인의 프로필'만 수정할 수 있습니다.
-- [강력 보안 조치]: 일반 유저가 본인의 role을 'Admin'으로 셀프 승격(Privilege Escalation)할 수 없도록 방지합니다.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- role 값을 수정하려 하지 않는 경우에만 일반 유저의 UPDATE 허용
      role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      -- 또는 현재 세션 사용자가 이미 Admin인 경우 role 수정 허용
      OR (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'Admin'
    )
  );

-- [보안 정책 3: 관리자 전체 관리 (ALL) - Admin 사용자]
-- Admin 권한을 가진 관리자는 모든 사용자의 프로필 조회, 수정, 권한 변경이 가능합니다.
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
CREATE POLICY "Admins have full access"
  ON public.profiles
  FOR ALL
  USING (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'Admin'
  );


-- ------------------------------------------------------------------------------
-- 5. 신규 회원가입 자동 프로필 생성 함수 및 트리거
-- ------------------------------------------------------------------------------
-- 소셜 로그인(구글, 카카오) 또는 이메일 가입 시 auth.users에 신규 유저가 추가되면,
-- 자동으로 public.profiles 테이블에 해당 정보를 채워 넣어주는 데이터베이스 트리거입니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
-- 보안 모범 규정: search_path를 비워 안전한 실행 환경을 보장합니다.
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    -- 소셜 로그인 제공자마다 다를 수 있는 이름 필드 자동 추출
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    -- 아바타 이미지 URL 자동 추출
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
    -- 기본 권한은 'User'로 설정 (추후 Table Editor에서 Admin 또는 NULL로 변경 가능)
    'User'::public.user_role
  );
  RETURN new;
END;
$$;

-- auth.users INSERT 시 트리거 발동 등록
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ------------------------------------------------------------------------------
-- 6. updated_at 자동 갱신 트리거
-- ------------------------------------------------------------------------------
-- 프로필 정보가 변경될 때마다 updated_at 시간을 자동으로 현재 시간으로 갱신합니다.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
