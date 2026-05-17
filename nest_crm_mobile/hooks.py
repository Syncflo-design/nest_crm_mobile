app_name        = "nest_crm_mobile"
app_title       = "NestERP CRM Mobile"
app_publisher   = "NestERP / Manifold SA"
app_description = "Simplified rep screen for customer view and quick Sales Order capture"
app_email       = "ops@syncflo.co.za"
app_license     = "MIT"
app_icon        = "octicon octicon-person"

# -------------------------------------------------------------
# Role-based home pages - reps land on the CRM Mobile screen.
# -------------------------------------------------------------
role_home_page = {
    "Sales User": "crm-mobile",
    "Sales Manager": "crm-mobile",
}

# -------------------------------------------------------------
# Fixtures - export this app's Workspace.
# -------------------------------------------------------------
fixtures = [
    {"doctype": "Workspace", "filters": [["module", "=", "Mobile CRM"]]},
]
