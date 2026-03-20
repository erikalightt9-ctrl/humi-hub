

"use client";
import { useState, useEffect } from "react";
import {

export const dynamic = "force-dynamic";

  Video,

  Loader2,

  Plus,

  ChevronUp,

  BookOpen,

  PenLine,


} from "lucide-react";

/* ------------------------------------------------------------------ */

/*  Types                                                              */


interface Course {
/* ------------------------------------------------------------------ */

  readonly id: string;

  readonly title: string;


}


interface Lesson {
type TierFilter = "ALL" | "BASIC" | "PROFESSIONAL" | "ADVANCED";

  readonly id: string;

  readonly title: string;

  readonly order: number;

  readonly durationMin: number;

  readonly isPublished: boolean;

  readonly isFreePreview: boolean;

  readonly tier: TierFilter;

  readonly videoUrl: string | null;


}

/* ------------------------------------------------------------------ */

/*  Constants                                                          */


/* ------------------------------------------------------------------ */

const TIER_TABS: readonly { readonly value: TierFilter; readonly label: string }[] = [

  { value: "ALL", label: "All Tiers" },

  { value: "BASIC", label: "Basic" },

  { value: "PROFESSIONAL", label: "Professional" },

  { value: "ADVANCED", label: "Advanced" },


] as const;

const TIER_BADGE_STYLES: Readonly<Record<string, string>> = {

  BASIC: "bg-gray-100 text-gray-700",

  PROFESSIONAL: "bg-blue-100 text-blue-700",

  ADVANCED: "bg-purple-100 text-purple-700",


};

const TIER_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [

  { value: "BASIC", label: "Basic" },

  { value: "PROFESSIONAL", label: "Professional" },

  { value: "ADVANCED", label: "Advanced" },


] as const;

/* ------------------------------------------------------------------ */

/*  Component                                                          */


/* ------------------------------------------------------------------ */

export default function AdminLessonsPage() {

  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("");

  const [lessons, setLessons] = useState<Lesson[]>([]);


  const [activeTier, setActiveTier] = useState<TierFilter>("ALL");

  // Manual create form state

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [order, setOrder] = useState(1);

  const [durationMin, setDurationMin] = useState(0);

  const [isPublished, setIsPublished] = useState(false);

  const [isFreePreview, setIsFreePreview] = useState(false);

  const [tier, setTier] = useState<string>("BASIC");

  const [videoUrl, setVideoUrl] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");


  const [success, setSuccess] = useState("");

  useEffect(() => {

    fetch("/api/admin/courses")

      .then((r) => r.json())

      .then((data) => { if (data.success) setCourses(data.data); })

      .catch(() => {});


  }, []);

  async function loadLessons(courseId: string, tierFilter?: TierFilter) {

    const filterTier = tierFilter ?? activeTier;

    const url = filterTier === "ALL"

      ? `/api/admin/lessons?courseId=${courseId}`

      : `/api/admin/lessons?courseId=${courseId}&tier=${filterTier}`;

    const res = await fetch(url);

    const data = await res.json();

    if (data.success) setLessons(data.data);


  }

  useEffect(() => {

    if (selectedCourse) loadLessons(selectedCourse);

    // eslint-disable-next-line react-hooks/exhaustive-deps


  }, [selectedCourse, activeTier]);

  async function handleCreate(e: React.FormEvent) {

    e.preventDefault();

    setSaving(true);

    setError("");

    setSuccess("");

    try {

      const res = await fetch("/api/admin/lessons", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          courseId: selectedCourse,

          title,

          content,

          order,

          durationMin,

          isPublished,

          isFreePreview,

          tier,

          videoUrl: videoUrl.trim() || null,

        }),

      });

      const data = await res.json();

      if (data.success) {

        setTitle("");

        setContent("");

        setOrder(lessons.length + 2);

        setDurationMin(0);

        setIsFreePreview(false);

        setVideoUrl("");

        setSuccess("Lesson created successfully!");

        loadLessons(selectedCourse);

      } else {

        setError(data.error ?? "Failed to create lesson");

      }

    } catch {

      setError("Network error");

    } finally {

      setSaving(false);

    }


  }

  async function togglePublish(lesson: Lesson) {

    await fetch(`/api/admin/lessons/${lesson.id}`, {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ isPublished: !lesson.isPublished }),

    });

    loadLessons(selectedCourse);


  }

  async function toggleFreePreview(lesson: Lesson) {

    await fetch(`/api/admin/lessons/${lesson.id}`, {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ isFreePreview: !lesson.isFreePreview }),

    });

    loadLessons(selectedCourse);


  }

  async function handleDeleteLesson(lessonId: string) {

    if (!confirm("Delete this lesson?")) return;

    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });

    loadLessons(selectedCourse);


  }

  const filteredLessons = activeTier === "ALL"

    ? lessons


    : lessons.filter((l) => l.tier === activeTier);

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold text-gray-900">Lesson Manager</h1>

        <p className="text-gray-500 text-sm mt-1">Create and manage course lessons by tier</p>


      </div>

      {/* Course selector */}

      <div className="bg-white rounded-xl shadow p-6">

        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>

        <select

          value={selectedCourse}

          onChange={(e) => setSelectedCourse(e.target.value)}

          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"

        >

          <option value="">-- Select a course --</option>

          {courses.map((c) => (

            <option key={c.id} value={c.id}>{c.title}</option>

          ))}

        </select>


      </div>

      {selectedCourse && (

        <>

          {/* Tier filter tabs + add button */}

          <div className="flex items-center gap-2 flex-wrap">

            {TIER_TABS.map((tab) => (

              <button

                key={tab.value}

                onClick={() => setActiveTier(tab.value)}

                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${

                  activeTier === tab.value

                    ? "bg-blue-600 text-white"

                    : "bg-white text-gray-600 hover:bg-gray-50 border"

                }`}

              >

                {tab.label}

              </button>


            ))}

            <div className="ml-auto">

              <button

                onClick={() => {

                  setShowCreateForm((prev) => !prev);

                  setError("");

                  setSuccess("");

                }}

                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"

              >

                {showCreateForm ? (

                  <>

                    <ChevronUp className="h-4 w-4" />

                    Hide Form

                  </>

                ) : (

                  <>

                    <PenLine className="h-4 w-4" />

                    Add Lesson

                  </>

                )}

              </button>

            </div>


          </div>

          {/* Manual create lesson form (collapsible) */}

          {showCreateForm && (

            <div className="bg-white rounded-xl shadow border-2 border-blue-100 overflow-hidden">

              <div className="bg-blue-50 px-6 py-3 flex items-center justify-between border-b border-blue-100">

                <div className="flex items-center gap-2">

                  <PenLine className="h-4 w-4 text-blue-600" />

                  <h2 className="font-semibold text-blue-900 text-sm">

                    Create New Lesson

                  </h2>

                </div>

                <button

                  onClick={() => setShowCreateForm(false)}

                  className="text-blue-400 hover:text-blue-600"

                >

                  <ChevronUp className="h-4 w-4" />

                </button>


              </div>

              <div className="p-6">

                {error && (

                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">

                    {error}

                  </div>

                )}

                {success && (

                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4">

                    {success}

                  </div>


                )}

                <form onSubmit={handleCreate} className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="md:col-span-2">

                      <label className="text-xs font-medium text-gray-600">

                        Lesson Title *

                      </label>

                      <input

                        value={title}

                        onChange={(e) => setTitle(e.target.value)}

                        required

                        placeholder="e.g. Introduction to QuickBooks for Virtual Assistants"

                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                    <div>

                      <label className="text-xs font-medium text-gray-600">Tier</label>

                      <select

                        value={tier}

                        onChange={(e) => setTier(e.target.value)}

                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"

                      >

                        {TIER_OPTIONS.map((t) => (

                          <option key={t.value} value={t.value}>{t.label}</option>

                        ))}

                      </select>

                    </div>


                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>

                      <label className="text-xs font-medium text-gray-600">Order</label>

                      <input

                        type="number"

                        value={order}

                        onChange={(e) => setOrder(Number(e.target.value))}

                        min={1}

                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                    <div>

                      <label className="text-xs font-medium text-gray-600">

                        Duration (minutes)

                      </label>

                      <input

                        type="number"

                        value={durationMin}

                        onChange={(e) => setDurationMin(Number(e.target.value))}

                        min={0}

                        placeholder="30"

                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                    <div>

                      <label className="text-xs font-medium text-gray-600">

                        Video URL (optional)

                      </label>

                      <input

                        value={videoUrl}

                        onChange={(e) => setVideoUrl(e.target.value)}

                        placeholder="https://youtube.com/embed/..."

                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"

                      />

                    </div>


                  </div>

                  <div>

                    <label className="text-xs font-medium text-gray-600">

                      Lesson Content *

                    </label>

                    <p className="text-xs text-gray-400 mb-1">

                      Supports markdown formatting (## headings, bullet points, **bold**, etc.)

                    </p>

                    <textarea

                      value={content}

                      onChange={(e) => setContent(e.target.value)}

                      required

                      rows={12}

                      placeholder={`## Learning Objectives\n- Objective 1\n- Objective 2\n\n## Lesson Content\nYour lesson content here...\n\n## Exercise\nPractice exercise instructions...\n\n## Quiz\nQ: Question?\nA: Answer`}

                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 font-mono"

                    />


                  </div>

                  <div className="flex items-center justify-between pt-2">

                    <div className="flex items-center gap-6">

                      <div className="flex items-center gap-2">

                        <input

                          type="checkbox"

                          id="published"

                          checked={isPublished}

                          onChange={(e) => setIsPublished(e.target.checked)}

                          className="rounded border-gray-300"

                        />

                        <label htmlFor="published" className="text-sm text-gray-600">

                          Publish immediately

                        </label>

                      </div>

                      <div className="flex items-center gap-2">

                        <input

                          type="checkbox"

                          id="freePreview"

                          checked={isFreePreview}

                          onChange={(e) => setIsFreePreview(e.target.checked)}

                          className="rounded border-gray-300"

                        />

                        <label htmlFor="freePreview" className="text-sm text-orange-600 font-medium">

                          Free preview lesson

                        </label>

                      </div>


                    </div>

                    <div className="flex gap-2">

                      <button

                        type="button"

                        onClick={() => setShowCreateForm(false)}

                        className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-800 border hover:bg-gray-50"

                      >

                        Cancel

                      </button>

                      <button

                        type="submit"

                        disabled={saving}

                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"

                      >

                        {saving ? (

                          <>

                            <Loader2 className="h-4 w-4 animate-spin" />

                            Saving...

                          </>

                        ) : (

                          <>

                            <Plus className="h-4 w-4" />

                            Create Lesson

                          </>

                        )}

                      </button>

                    </div>

                  </div>

                </form>

              </div>

            </div>


          )}

          {/* Lessons list */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="flex items-center justify-between mb-4">

              <h2 className="font-semibold text-gray-700 flex items-center gap-2">

                <BookOpen className="h-4 w-4 text-gray-400" />

                Lessons ({filteredLessons.length})

              </h2>

            </div>

            {filteredLessons.length === 0 ? (

              <div className="text-center py-10">

                <div className="bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">

                  <BookOpen className="h-7 w-7 text-gray-400" />

                </div>

                <p className="text-gray-500 text-sm mb-4">

                  No lessons yet for this tier.

                </p>

                <button

                  onClick={() => setShowCreateForm(true)}

                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition mx-auto"

                >

                  <PenLine className="h-3.5 w-3.5" />

                  Add First Lesson

                </button>

              </div>

            ) : (

              <div className="space-y-2">

                {filteredLessons.map((l) => (

                  <div

                    key={l.id}

                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"

                  >

                    <div className="flex items-center gap-2 flex-wrap">

                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">

                        #{l.order} {l.title}

                        {l.videoUrl && (

                          <Video className="h-3.5 w-3.5 text-blue-500" aria-label="Has video" />

                        )}

                      </span>

                      <span

                        className={`text-xs px-2 py-0.5 rounded-full ${

                          TIER_BADGE_STYLES[l.tier] ?? "bg-gray-100 text-gray-500"

                        }`}

                      >

                        {l.tier}

                      </span>

                      <span

                        className={`text-xs px-2 py-0.5 rounded-full ${

                          l.isPublished

                            ? "bg-green-100 text-green-700"

                            : "bg-gray-100 text-gray-500"

                        }`}

                      >

                        {l.isPublished ? "Published" : "Draft"}

                      </span>

                      {l.isFreePreview && (

                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">

                          Free Preview

                        </span>

                      )}

                    </div>

                    <div className="flex gap-2">

                      <button

                        onClick={() => toggleFreePreview(l)}

                        className={`text-xs ${

                          l.isFreePreview

                            ? "text-orange-600 hover:text-orange-800"

                            : "text-gray-500 hover:text-orange-600"

                        }`}

                      >

                        {l.isFreePreview ? "Remove Preview" : "Make Preview"}

                      </button>

                      <button

                        onClick={() => togglePublish(l)}

                        className="text-xs text-blue-600 hover:text-blue-800"

                      >

                        {l.isPublished ? "Unpublish" : "Publish"}

                      </button>

                      <button

                        onClick={() => handleDeleteLesson(l.id)}

                        className="text-xs text-red-500 hover:text-red-700"

                      >

                        Delete

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </>

      )}

    </div>

  );
}
}
