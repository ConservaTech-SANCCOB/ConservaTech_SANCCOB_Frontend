"use client";

import { TrainingVolunteerProfile, TrainingSkill } from "../../app/lib/api/training_staff";

interface Props {
  profile: TrainingVolunteerProfile;
  onClose: () => void;
}

export default function TrainingHistoryModal({ profile, onClose }: Props) {
  // Seasonal skills are pulled out of Pen Routines into their own section
  const penRoutinesCore = (profile.penRoutines ?? []).filter((s) => s.category !== "Seasonal");
  const additionalSkills = [
    ...(profile.penRoutines ?? []).filter((s) => s.category === "Seasonal"),
    ...(profile.seasonalSkills ?? []),
  ];

  const supporting = profile.supportingAreas ?? [];
  const stage1Complete = supporting.filter((s) => s.isSignedOff).length;
  const stage2Complete = penRoutinesCore.filter((s) => s.isSignedOff).length;

  const pct = (complete: number, total: number) =>
    total > 0 ? Math.round((complete / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Volunteer Training History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <p className="font-bold text-slate-900">
              {profile.firstName} {profile.lastName}
            </p>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{Math.round(profile.progressPercentage)}%</p>
              <p className="text-xs text-slate-500">Overall progress</p>
              <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {profile.trainingStatus ?? "In Progress"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Supporting Areas" pct={pct(stage1Complete, supporting.length)} />
            <MiniStat label="Pen Routines" pct={pct(stage2Complete, penRoutinesCore.length)} />
            <MiniStat label="Overall" pct={Math.round(profile.progressPercentage)} />
          </div>

          <SkillSection
            stageLabel="Stage 1 — Supporting Areas"
            complete={stage1Complete}
            total={supporting.length}
            skills={supporting}
          />

          <SkillSection
            stageLabel="Stage 2 — Pen Routines"
            complete={stage2Complete}
            total={penRoutinesCore.length}
            skills={penRoutinesCore}
          />

          {additionalSkills.length > 0 && (
            <SkillSection
              stageLabel="Additional Skills"
              complete={additionalSkills.filter((s) => s.isSignedOff).length}
              total={additionalSkills.length}
              skills={additionalSkills}
              showSeasonalTag
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{pct}%</p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-blue-800" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SkillSection({
  stageLabel,
  complete,
  total,
  skills,
  showSeasonalTag,
}: {
  stageLabel: string;
  complete: number;
  total: number;
  skills: TrainingSkill[];
  showSeasonalTag?: boolean;
}) {
  const isFullyComplete = total > 0 && complete === total;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            isFullyComplete ? "bg-green-500" : "bg-slate-300"
          }`}
        >
          {isFullyComplete ? "✓" : ""}
        </span>
        <h3 className="font-bold text-slate-900">{stageLabel}</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isFullyComplete ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {complete}/{total} Complete {isFullyComplete && "✓"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {skills.map((skill) => (
          <SkillRow key={skill.skillId} skill={skill} showSeasonalTag={showSeasonalTag} />
        ))}
      </div>
    </div>
  );
}

function SkillRow({ skill, showSeasonalTag }: { skill: TrainingSkill; showSeasonalTag?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        skill.isSignedOff ? "bg-green-50 border-green-100" : "bg-slate-50 border-slate-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
            skill.isSignedOff ? "bg-green-500 text-white" : "bg-slate-200"
          }`}
        >
          {skill.isSignedOff ? "✓" : ""}
        </span>
        <span className={`text-sm ${skill.isSignedOff ? "text-green-700 font-medium" : "text-slate-500"}`}>
          {skill.skillName}
        </span>
        {showSeasonalTag && skill.category === "Seasonal" && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
            Seasonal
          </span>
        )}
      </div>

      {skill.isSignedOff && skill.trainerName && (
        <p className="text-xs text-green-600 mt-1 ml-6">
          Signed off by {skill.trainerName}
          {skill.signedOffAt && ` · ${new Date(skill.signedOffAt).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}