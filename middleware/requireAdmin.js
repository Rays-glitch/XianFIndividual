export const requireAdmin = (req, res, next) => {
  if (req.session?.admin) {
    return next();
  }

  const returnTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?next=${returnTo}`);
};
