import bcrypt from "bcrypt";

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPasswordHash =
  process.env.ADMIN_PASSWORD_HASH ||
  "$2b$12$O/jDc13bCTo/iZOugc5iOeQrfYBS1xXoeC1F8f82hmfO8zPy2ugUy";

const safeReturnPath = (value) => {
  if (typeof value !== "string" || !value.startsWith("/") || value.includes("\\")) {
    return "/customer-dashboard";
  }

  try {
    const target = new URL(value, "http://japzgrill.local");
    if (target.origin !== "http://japzgrill.local") {
      return "/customer-dashboard";
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/customer-dashboard";
  }
};

export const loginPage = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/customer-dashboard");
  }

  res.render("login", {
    title: "Admin Login | JAPZGRILL",
    next: safeReturnPath(req.query.next)
  });
};

export const login = async (req, res, next) => {
  const username = String(req.body.username ?? "").trim();
  const password = String(req.body.password ?? "");

  try {
    const passwordMatches = await bcrypt.compare(password, adminPasswordHash);
    if (username !== adminUsername || !passwordMatches) {
      req.flash("error_msg", "Invalid username or password.");
      return res.redirect("/login");
    }

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.admin = { username: adminUsername };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.redirect(safeReturnPath(req.body.next));
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};
