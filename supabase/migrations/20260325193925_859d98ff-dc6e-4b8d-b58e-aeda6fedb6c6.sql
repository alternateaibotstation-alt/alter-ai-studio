DROP POLICY IF EXISTS "Anyone can read referral by code" ON public.referrals;

CREATE POLICY "Users can read referrals they are part of"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);