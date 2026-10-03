import React from 'react';
import { Users, Lock } from 'lucide-react';
import { Team } from '../types/quiz';

interface TeamStatusWidgetProps {
  team?: Team;
  isAnswerLocked: boolean;
  lockedByUserName?: string;
  responseTimeMs?: number;
}

export const TeamStatusWidget: React.FC<TeamStatusWidgetProps> = ({
  team,
  isAnswerLocked,
  lockedByUserName,
  responseTimeMs,
}) => {
  if (!team) return null;

  return (
    <div className="ui-card p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E2]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#6B6B6B]" />
          <div>
            <h4 className="text-xs font-bold text-[#171717]">{team.name}</h4>
            <span className="text-[10px] text-[#6B6B6B] font-mono">CODE: {team.code}</span>
          </div>
        </div>

        {isAnswerLocked ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A16207]">
            <span className="w-2 h-2 rounded-full bg-[#A16207]"></span>
            Answer Locked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16803C]">
            <span className="w-2 h-2 rounded-full bg-[#16803C]"></span>
            Active
          </span>
        )}
      </div>

      {isAnswerLocked && (
        <div className="p-2.5 rounded-md bg-[#FEFCE8] border border-[#FEF08A] text-xs text-[#854D0E] flex items-center justify-between">
          <span>
            Locked by: <strong>{lockedByUserName || 'Teammate'}</strong>
          </span>
          {responseTimeMs !== undefined && (
            <span className="font-mono text-[11px] font-semibold">
              {(responseTimeMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>
      )}

      {/* Team Members List with minimal dot indicators */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B] block">
          Team Members ({team.members ? team.members.length : 0} / 4)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {team.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] text-xs"
            >
              <span className="font-medium text-[#171717] truncate">{member.fullName}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#16803C] font-medium shrink-0 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16803C]"></span>
                Online
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
