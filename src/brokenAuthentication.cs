public ActionResult Login(string username, string password)
{
    if (username == "admin" && password == "admin123")
    {
        Session["username"] = username;
        return RedirectToAction("Dashboard");
    }

    ViewBag.Error = "Invalid login";
    return View();
}