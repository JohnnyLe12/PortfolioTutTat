import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Plus, X, Pencil, Trash2, Building2, Users, Briefcase, Settings } from "lucide-react";
import { apiPost, apiGet } from "../lib/api";

const TABS = [
  { key: "about", label: "About", icon: Building2 },
  { key: "team", label: "Team", icon: Users },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "metadata", label: "Metadata", icon: Settings },
];

export default function CreateCompanyProfilePage() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState("about");

  // About section
  const [companyName, setCompanyName] = useState("");
  const [summary, setSummary] = useState("");
  const [productsServices, setProductsServices] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [hrContactEmail, setHrContactEmail] = useState("");
  const [hrContactPhone, setHrContactPhone] = useState("");

  // Team section
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: "", role: "", avatarUrl: "" });
  const [editingTeamIndex, setEditingTeamIndex] = useState(null);
  const [teamErrors, setTeamErrors] = useState({});

  // Metadata section
  const [employeeCount, setEmployeeCount] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [referenceLinks, setReferenceLinks] = useState([]);
  const [linkForm, setLinkForm] = useState({ url: "", label: "" });
  const [linkErrors, setLinkErrors] = useState({});

  // Jobs (auto-linked, read-only on create)
  const [jobs, setJobs] = useState([]);

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check if profile already exists — redirect to edit page
  useEffect(() => {
    let cancelled = false;
    async function checkExistingProfile() {
      try {
        await apiGet("/company/profile/me");
        if (!cancelled) {
          navigate("/edit-company-profile", { replace: true });
        }
      } catch {
        // 404 or error means no profile — stay on create page
      } finally {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      }
    }
    checkExistingProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  // Try to load jobs (will be empty for new company)
  useEffect(() => {
    let cancelled = false;
    async function loadJobs() {
      try {
        const result = await apiGet("/company/jobs");
        if (!cancelled && result?.data) {
          setJobs(result.data);
        }
      } catch {
        // No jobs yet — expected for new company
      }
    }
    loadJobs();
    return () => { cancelled = true; };
  }, []);

  // ─── Team Member Handlers ───────────────────────────────────────────────────

  const validateTeamMember = () => {
    const newErrors = {};
    if (!teamForm.name.trim()) {
      newErrors.name = "Name is required";
    } else if (teamForm.name.length > 255) {
      newErrors.name = "Name must be at most 255 characters";
    }
    if (!teamForm.role.trim()) {
      newErrors.role = "Role is required";
    } else if (teamForm.role.length > 255) {
      newErrors.role = "Role must be at most 255 characters";
    }
    if (teamForm.avatarUrl && teamForm.avatarUrl.length > 500) {
      newErrors.avatarUrl = "Avatar URL must be at most 500 characters";
    }
    setTeamErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addTeamMember = () => {
    if (!validateTeamMember()) return;
    const member = {
      name: teamForm.name.trim(),
      role: teamForm.role.trim(),
      avatarUrl: teamForm.avatarUrl.trim() || undefined,
    };
    setTeamMembers([...teamMembers, member]);
    setTeamForm({ name: "", role: "", avatarUrl: "" });
    setTeamErrors({});
  };

  const startEditTeamMember = (index) => {
    const member = teamMembers[index];
    setTeamForm({ name: member.name, role: member.role, avatarUrl: member.avatarUrl || "" });
    setEditingTeamIndex(index);
    setTeamErrors({});
  };

  const saveEditTeamMember = () => {
    if (!validateTeamMember()) return;
    const updated = [...teamMembers];
    updated[editingTeamIndex] = {
      name: teamForm.name.trim(),
      role: teamForm.role.trim(),
      avatarUrl: teamForm.avatarUrl.trim() || undefined,
    };
    setTeamMembers(updated);
    setTeamForm({ name: "", role: "", avatarUrl: "" });
    setEditingTeamIndex(null);
    setTeamErrors({});
  };

  const cancelEditTeamMember = () => {
    setTeamForm({ name: "", role: "", avatarUrl: "" });
    setEditingTeamIndex(null);
    setTeamErrors({});
  };

  const deleteTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
    if (editingTeamIndex === index) {
      cancelEditTeamMember();
    } else if (editingTeamIndex !== null && editingTeamIndex > index) {
      setEditingTeamIndex(editingTeamIndex - 1);
    }
  };

  // ─── Reference Links Handlers ───────────────────────────────────────────────

  const validateLink = () => {
    const newErrors = {};
    if (!linkForm.url.trim()) {
      newErrors.url = "URL is required";
    } else if (linkForm.url.length > 500) {
      newErrors.url = "URL must be at most 500 characters";
    } else {
      try {
        new URL(linkForm.url.trim());
      } catch {
        newErrors.url = "Must be a valid URL";
      }
    }
    if (!linkForm.label.trim()) {
      newErrors.label = "Label is required";
    } else if (linkForm.label.length > 255) {
      newErrors.label = "Label must be at most 255 characters";
    }
    setLinkErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addLink = () => {
    if (!validateLink()) return;
    setReferenceLinks([...referenceLinks, { url: linkForm.url.trim(), label: linkForm.label.trim() }]);
    setLinkForm({ url: "", label: "" });
    setLinkErrors({});
  };

  const removeLink = (index) => {
    setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
  };

  // ─── Form Validation ───────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};

    if (!companyName.trim()) {
      newErrors.companyName = "Company Name is required";
    } else if (companyName.length > 255) {
      newErrors.companyName = "Company Name must be at most 255 characters";
    }

    if (websiteUrl.trim() && !websiteUrl.trim().startsWith("https://")) {
      newErrors.websiteUrl = "Website URL must start with https://";
    } else if (websiteUrl.length > 500) {
      newErrors.websiteUrl = "Website URL must be at most 500 characters";
    }

    if (hrContactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(hrContactEmail.trim())) {
        newErrors.hrContactEmail = "Invalid email format";
      } else if (hrContactEmail.length > 255) {
        newErrors.hrContactEmail = "Email must be at most 255 characters";
      }
    }

    if (hrContactPhone.length > 50) {
      newErrors.hrContactPhone = "Phone must be at most 50 characters";
    }

    if (officeAddress.length > 500) {
      newErrors.officeAddress = "Office Address must be at most 500 characters";
    }

    if (employeeCount.length > 50) {
      newErrors.employeeCount = "Employee Count must be at most 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      // Switch to About tab if there are errors there
      if (errors.companyName || errors.websiteUrl || errors.hrContactEmail || errors.hrContactPhone) {
        setActiveTab("about");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        companyName: companyName.trim(),
        summary: summary.trim() || undefined,
        productsServices: productsServices.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        hrContactEmail: hrContactEmail.trim() || undefined,
        hrContactPhone: hrContactPhone.trim() || undefined,
        teamMembers,
        employeeCount: employeeCount.trim() || undefined,
        officeAddress: officeAddress.trim() || undefined,
        referenceLinks,
      };

      await apiPost("/company/profile", payload);
      navigate("/company-dashboard");
    } catch (err) {
      setApiError(err.message || "Failed to create company profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Your Company Profile
          </h1>
          <p className="text-lg text-gray-600">
            Set up your company profile to start posting jobs and attracting talent
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-gray-200 mb-6">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ─── ABOUT TAB ─────────────────────────────────────────── */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your Company Name"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: "" }));
                    }}
                    maxLength={255}
                    className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.companyName ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Summary
                  </label>
                  <textarea
                    placeholder="Brief overview of your company..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    maxLength={5000}
                    className="w-full min-h-[100px] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">{summary.length}/5000</p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Products / Services
                  </label>
                  <textarea
                    placeholder="Describe your products or services..."
                    value={productsServices}
                    onChange={(e) => setProductsServices(e.target.value)}
                    maxLength={5000}
                    className="w-full min-h-[100px] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">{productsServices.length}/5000</p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourcompany.com"
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (errors.websiteUrl) setErrors((prev) => ({ ...prev, websiteUrl: "" }));
                    }}
                    maxLength={500}
                    className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.websiteUrl ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.websiteUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      HR Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="hr@yourcompany.com"
                      value={hrContactEmail}
                      onChange={(e) => {
                        setHrContactEmail(e.target.value);
                        if (errors.hrContactEmail) setErrors((prev) => ({ ...prev, hrContactEmail: "" }));
                      }}
                      maxLength={255}
                      className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.hrContactEmail ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.hrContactEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.hrContactEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      HR Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+84 xxx xxx xxx"
                      value={hrContactPhone}
                      onChange={(e) => {
                        setHrContactPhone(e.target.value);
                        if (errors.hrContactPhone) setErrors((prev) => ({ ...prev, hrContactPhone: "" }));
                      }}
                      maxLength={50}
                      className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.hrContactPhone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.hrContactPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.hrContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TEAM TAB ──────────────────────────────────────────── */}
            {activeTab === "team" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Team Members</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your team members to showcase your team
                  </p>

                  {/* Team member form */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-sm text-gray-600">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Member name"
                          value={teamForm.name}
                          onChange={(e) => {
                            setTeamForm((prev) => ({ ...prev, name: e.target.value }));
                            if (teamErrors.name) setTeamErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          maxLength={255}
                          className={`w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            teamErrors.name ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {teamErrors.name && (
                          <p className="mt-1 text-xs text-red-600">{teamErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-sm text-gray-600">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CTO, Designer"
                          value={teamForm.role}
                          onChange={(e) => {
                            setTeamForm((prev) => ({ ...prev, role: e.target.value }));
                            if (teamErrors.role) setTeamErrors((prev) => ({ ...prev, role: "" }));
                          }}
                          maxLength={255}
                          className={`w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            teamErrors.role ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {teamErrors.role && (
                          <p className="mt-1 text-xs text-red-600">{teamErrors.role}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-gray-600">
                        Avatar URL (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/avatar.jpg"
                        value={teamForm.avatarUrl}
                        onChange={(e) => {
                          setTeamForm((prev) => ({ ...prev, avatarUrl: e.target.value }));
                          if (teamErrors.avatarUrl) setTeamErrors((prev) => ({ ...prev, avatarUrl: "" }));
                        }}
                        maxLength={500}
                        className={`w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          teamErrors.avatarUrl ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teamErrors.avatarUrl && (
                        <p className="mt-1 text-xs text-red-600">{teamErrors.avatarUrl}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editingTeamIndex !== null ? (
                        <>
                          <button
                            type="button"
                            onClick={saveEditTeamMember}
                            className="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTeamMember}
                            className="h-9 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={addTeamMember}
                          className="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Member
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team members list */}
                  {teamMembers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white"
                        >
                          <div className="flex items-center gap-3">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium text-sm">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditTeamMember(index)}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                              aria-label={`Edit ${member.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTeamMember(index)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`Delete ${member.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {teamMembers.length === 0 && (
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      No team members added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ─── JOBS TAB ──────────────────────────────────────────── */}
            {activeTab === "jobs" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Posted Jobs</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Jobs you post will automatically appear here
                  </p>
                </div>

                {jobs.length > 0 ? (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-all"
                      >
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {job.location || "Remote"} • {job.employmentType || "Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No jobs posted yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your posted jobs will appear here automatically
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── METADATA TAB ──────────────────────────────────────── */}
            {activeTab === "metadata" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Employee Count
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50-100"
                      value={employeeCount}
                      onChange={(e) => {
                        setEmployeeCount(e.target.value);
                        if (errors.employeeCount) setErrors((prev) => ({ ...prev, employeeCount: "" }));
                      }}
                      maxLength={50}
                      className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.employeeCount ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.employeeCount && (
                      <p className="mt-1 text-sm text-red-600">{errors.employeeCount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Office Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Street, City, Country"
                      value={officeAddress}
                      onChange={(e) => {
                        setOfficeAddress(e.target.value);
                        if (errors.officeAddress) setErrors((prev) => ({ ...prev, officeAddress: "" }));
                      }}
                      maxLength={500}
                      className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.officeAddress ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.officeAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.officeAddress}</p>
                    )}
                  </div>
                </div>

                {/* Reference Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Reference Links</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add links to your social media, blog, or other resources
                  </p>

                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-sm text-gray-600">URL</label>
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={linkForm.url}
                          onChange={(e) => {
                            setLinkForm((prev) => ({ ...prev, url: e.target.value }));
                            if (linkErrors.url) setLinkErrors((prev) => ({ ...prev, url: "" }));
                          }}
                          maxLength={500}
                          className={`w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            linkErrors.url ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {linkErrors.url && (
                          <p className="mt-1 text-xs text-red-600">{linkErrors.url}</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-sm text-gray-600">Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Company Blog"
                          value={linkForm.label}
                          onChange={(e) => {
                            setLinkForm((prev) => ({ ...prev, label: e.target.value }));
                            if (linkErrors.label) setLinkErrors((prev) => ({ ...prev, label: "" }));
                          }}
                          maxLength={255}
                          className={`w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            linkErrors.label ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {linkErrors.label && (
                          <p className="mt-1 text-xs text-red-600">{linkErrors.label}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addLink}
                      className="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  </div>

                  {referenceLinks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {referenceLinks.map((link, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{link.label}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLink(index)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${link.label}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {referenceLinks.length === 0 && (
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      No reference links added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex gap-3 pt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 h-12 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Profile..." : "Create Company Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
