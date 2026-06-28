export function verifySecret(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.APP_SECRET_PASSWORD;
}
