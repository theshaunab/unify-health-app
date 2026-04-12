-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TABLES
-- =====================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('full_access', 'group_class', 'personal_training', 'basic')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  join_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  week_number INTEGER,
  coach_note TEXT,
  equipment TEXT,
  focus TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  block_label TEXT NOT NULL,
  block_type TEXT NOT NULL,
  block_rounds INTEGER,
  block_sets INTEGER,
  block_duration INTEGER,
  exercise_label TEXT,
  exercise_name TEXT NOT NULL,
  sub_label TEXT,
  sets INTEGER,
  reps INTEGER,
  reps_unit TEXT DEFAULT 'reps',
  order_index INTEGER NOT NULL,
  youtube_url TEXT,
  coaching_cue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id),
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE TABLE IF NOT EXISTS public.set_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps_completed INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

-- Users: members can read their own row, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Programs: everyone authenticated can read, only admins can write
CREATE POLICY "Authenticated users can view programs" ON public.programs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Exercises: same as programs
CREATE POLICY "Authenticated users can view exercises" ON public.exercises
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage exercises" ON public.exercises
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Workout logs: members see/edit own, admins see all
CREATE POLICY "Members can view own workout logs" ON public.workout_logs
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Members can insert own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can update own workout logs" ON public.workout_logs
  FOR UPDATE USING (user_id = auth.uid());

-- Set logs
CREATE POLICY "Members can view own set logs" ON public.set_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND (wl.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
      ))
    )
  );

CREATE POLICY "Members can insert own set logs" ON public.set_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own set logs" ON public.set_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

-- =====================
-- SEED DATA
-- =====================

-- Insert Monday program
INSERT INTO public.programs (id, name, date, week_number, coach_note, equipment, focus) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Monday 3.30 W1',
  '2025-03-30',
  1,
  'Take the warm-up seriously today — hip mobility sets up everything in this session. In activation, quality over speed. For strength supersets, move between A1 and A2 with minimal rest, then take your full 90s after each round. Every rep is an investment.',
  'Barbells, dumbbells, cables, foam roller',
  'Strength & mobility'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Tuesday 3.31 W1',
  '2025-03-31',
  1,
  'Take the warm-up seriously — thoracic rotation sets up the trap bar pulls. In the AMRAP, move with intention, quality reps over speed. For wall squats: feel the difference between the loaded reps and the bodyweight hold.',
  'Trap bar, dumbbells, med ball, KB, jump rope, cables',
  'Power & strength'
);

-- MONDAY EXERCISES
INSERT INTO public.exercises (program_id, block_label, block_type, block_rounds, exercise_name, sub_label, sets, reps, reps_unit, order_index, coaching_cue) VALUES
-- WARMUP
('a0000000-0000-0000-0000-000000000001', 'WARMUP', 'warmup', NULL, 'Hip flexor couch stretch — right side', 'Right side · 1 min', 1, NULL, 'timed', 1, 'Drive hip forward, keep torso tall.'),
('a0000000-0000-0000-0000-000000000001', 'WARMUP', 'warmup', NULL, 'Hip flexor couch stretch — left side', 'Left side · 1 min', 1, NULL, 'timed', 2, 'Drive hip forward, keep torso tall.'),
-- CIRCUIT (2 rounds)
('a0000000-0000-0000-0000-000000000001', 'CIRCUIT', 'circuit', 2, 'Half kneeling wall facing sliders', '10 reps · left side only', 2, 10, 'reps', 3, 'Keep hips square throughout.'),
('a0000000-0000-0000-0000-000000000001', 'CIRCUIT', 'circuit', 2, 'Adductor slide outs short lever', '10 each side', 2, 10, 'each side', 4, 'Control the slide out and in.'),
('a0000000-0000-0000-0000-000000000001', 'CIRCUIT', 'circuit', 2, 'Side lying bow and arrow', '10 each side', 2, 10, 'each side', 5, 'Keep knees stacked, open thoracic rotation.'),
('a0000000-0000-0000-0000-000000000001', 'CIRCUIT', 'circuit', 2, 'Dead bugs', '10 each side', 2, 10, 'each side', 6, 'Lower back glued to the floor. Slow and controlled.'),
('a0000000-0000-0000-0000-000000000001', 'CIRCUIT', 'circuit', 2, 'Split squat holds', '20 sec each side · timed', 2, NULL, 'timed', 7, 'Feel the glute working. Keep upright torso.'),
-- SUPERSET A (3 sets)
('a0000000-0000-0000-0000-000000000001', 'SUPERSET A', 'superset_a', NULL, 'Front foot elevated split squats', '6 each side', 3, 6, 'each side', 8, 'Front foot on a plate or step. Drive through heel.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET A', 'superset_a', NULL, 'KB sumo deadlift', '8 reps', 3, 8, 'reps', 9, 'Wide stance, KB between feet. Hinge and drive hips through.'),
-- SUPERSET B (3 sets)
('a0000000-0000-0000-0000-000000000001', 'SUPERSET B', 'superset_b', NULL, 'Incline chest press', '8 reps', 3, 8, 'reps', 10, 'Set shoulder blades back and down. Controlled descent.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET B', 'superset_b', NULL, 'Incline chest supported DB reverse fly', '10 reps', 3, 10, 'reps', 11, 'Lead with elbows wide. Squeeze rear delts at top.'),
-- SUPERSET C (3 sets)
('a0000000-0000-0000-0000-000000000001', 'SUPERSET C', 'superset_c', NULL, 'Short side plank + cable T', '8 each side', 3, 8, 'each side', 12, 'Hold side plank, pull cable in a T shape. Control rotation.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET C', 'superset_c', NULL, 'DB loaded frog bridges', '12 reps', 3, 12, 'reps', 13, 'Feet together, knees wide. Drive hips up and squeeze glutes.'),
-- SUPERSET D (3 sets)
('a0000000-0000-0000-0000-000000000001', 'SUPERSET D', 'superset_d', NULL, 'AB dolly roll outs', '12 reps', 3, 12, 'reps', 14, 'Keep hips in line with torso. Brace core throughout.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET D', 'superset_d', NULL, 'Cable lift', '8 each side', 3, 8, 'each side', 15, 'Rotate from thoracic, not lumbar. Control the descent.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET D', 'superset_d', NULL, 'Dumbbell hammer curl', '10 reps', 3, 10, 'reps', 16, 'Neutral grip, no swinging. Squeeze at top.'),
('a0000000-0000-0000-0000-000000000001', 'SUPERSET D', 'superset_d', NULL, 'Kneeling face pulls', '8 reps', 3, 8, 'reps', 17, 'Pull toward face, elbows high and wide. External rotate at end.'),
-- COOLDOWN
('a0000000-0000-0000-0000-000000000001', 'COOLDOWN', 'cooldown', NULL, 'Foam roller chest opener stretch', '1 min timed', 1, NULL, 'timed', 18, 'Arms out wide on the roller, breathe and relax.');

-- TUESDAY EXERCISES
INSERT INTO public.exercises (program_id, block_label, block_type, block_rounds, exercise_label, exercise_name, sub_label, sets, reps, reps_unit, order_index, coaching_cue) VALUES
-- WARMUP SUPERSET (amber, 3 sets)
('a0000000-0000-0000-0000-000000000002', 'SUPERSET WARMUP', 'warmup_superset', 3, 'W1', 'Cat/camel + overhead reaches + trunk rotations', '30 sec each side · timed', 3, NULL, 'timed', 1, 'Flow through each movement smoothly.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET WARMUP', 'warmup_superset', 3, 'W2', 'Alternating collapsed groiner stretch', '30 sec alternating · timed', 3, NULL, 'timed', 2, 'Sink into each hip. Breathe through the stretch.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET WARMUP', 'warmup_superset', 3, 'W3', 'Squat to hinge', '30 sec · timed', 3, NULL, 'timed', 3, 'Feel the difference between squat pattern and hinge pattern.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET WARMUP', 'warmup_superset', 3, 'W4', 'Lateral lunge flow + rotation', '30 sec alternating · timed', 3, NULL, 'timed', 4, 'Keep chest up. Rotate through the thoracic, not lumbar.'),
-- SUPERSET A (3 sets)
('a0000000-0000-0000-0000-000000000002', 'SUPERSET A', 'superset_a', NULL, 'A1', 'Broad jump', '5 reps · bodyweight', 3, 5, 'reps', 5, 'Load the hips on landing. Soft knees, absorb the impact.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET A', 'superset_a', NULL, 'A2', 'Med ball alternating wall toss', '5 each side', 3, 5, 'each side', 6, 'Rotate through thoracic. Explosive release.'),
-- AMRAP (9 min)
('a0000000-0000-0000-0000-000000000002', 'AMRAP', 'amrap', NULL, NULL, 'KB lateral lunge', '8 each side', NULL, 8, 'each side', 7, 'Sit back into the hip. Keep chest up.'),
('a0000000-0000-0000-0000-000000000002', 'AMRAP', 'amrap', NULL, NULL, 'Stationary dynamic bear crawls', '10 each side', NULL, 10, 'each side', 8, 'Hips just above knee height. Small, controlled shifts.'),
('a0000000-0000-0000-0000-000000000002', 'AMRAP', 'amrap', NULL, NULL, 'Jump rope', '30 sec', NULL, NULL, 'timed', 9, 'Stay light on your feet. Consistent rhythm.'),
-- SUPERSET B (amber, 3 sets)
('a0000000-0000-0000-0000-000000000002', 'SUPERSET B', 'superset_b', NULL, 'B1', 'Trap bar deadlift', '6 reps', 3, 6, 'reps', 10, 'Set your back, drive floor away. Keep the bar close.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET B', 'superset_b', NULL, 'B2', 'Dumbbell bench press', '10 reps', 3, 10, 'reps', 11, 'Arch and pack the shoulders. Full range of motion.'),
-- SUPERSET C (sage green, 3 sets)
('a0000000-0000-0000-0000-000000000002', 'SUPERSET C', 'superset_c', NULL, 'C1', 'Foam roll bodyweight wall squats', '8 reps + 30 sec wall sit', 3, 8, 'reps', 12, 'Feel the quads load on the wall sit. Breathe through it.'),
('a0000000-0000-0000-0000-000000000002', 'SUPERSET C', 'superset_c', NULL, 'C2', 'Scap pull ups', '8 reps · bodyweight', 3, 8, 'reps', 13, 'Depress scapula without bending elbows. Full hang to start.');
