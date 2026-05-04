import React, { useState } from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
  profileFrameClass?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ username, avatarUrl, size = 40, className, onClick, profileFrameClass = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const frameClass = profileFrameClass ? ` ${profileFrameClass}` : '';
  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`user-avatar user-avatar-img${frameClass} ${className || ''}`}
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
        onClick={onClick}
        title={username}
      />
    );
  }

  return (
    <div
      className={`user-avatar user-avatar-initials${frameClass} ${className || ''}`}
      style={style}
      onClick={onClick}
      title={username}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
};
