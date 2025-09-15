import React from 'react';
import upvoteIcon from '../../../assets/reddit_upvote.png';
import type { PostLite } from '../../shared/types/api';
import { CountUpNumber } from './atoms/CountUpNumber';

interface PostCardProps {
  post: PostLite;
  onClick?: () => void;
  selected?: boolean;
  dim?: boolean;
  revealed?: boolean;
  disabled?: boolean;
  /** If true, animate the score counting up when it becomes revealed */
  animateOnReveal?: boolean;
  /** If true, temporarily hide the media (used to clear losing image) */
  hideMedia?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick, selected, dim, revealed, disabled, animateOnReveal, hideMedia }) => {
  const [mediaLoaded, setMediaLoaded] = React.useState(false);
  const [mediaError, setMediaError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    setMediaLoaded(false);
    setMediaError(false);
    // If the image is already cached, mark as loaded immediately to avoid spinner flash
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setMediaLoaded(true);
    }
  }, [post.thumbnail]);

  return (
    <button
      onClick={onClick}
      disabled={disabled || revealed}
      className={[
        'group relative flex-1 rounded-3xl p-[2px] transition-all duration-300 overflow-hidden',
        'bg-gradient-to-br from-[#ff4500] via-[#ff8717] to-[#ff4500]',
        dim ? 'opacity-60' : '',
        selected ? 'scale-[1.02] shadow-xl' : '',
        !selected && !dim && !revealed ? 'hover:shadow-lg hover:scale-[1.015]' : '',
        revealed && !selected ? 'cursor-default' : '',
      ].filter(Boolean).join(' ')}
      aria-label={post.title}
      title={post.title}
    >
      <div className={[
        'h-full w-full rounded-[inherit] relative flex flex-col items-stretch justify-between gap-4',
        'min-h-[260px] sm:min-h-[300px] bg-white'
      ].join(' ')}>
        {/* Media */}
        <div className="relative h-40 sm:h-48 rounded-t-[calc(theme(borderRadius.3xl)-2px)] overflow-hidden bg-[#fff5ef]">
          {post.thumbnail ? (
            <>
              <img
                src={post.thumbnail}
                alt="thumbnail"
                className={[
                  'w-full h-full object-contain transition-opacity duration-300',
                  hideMedia || !mediaLoaded ? 'opacity-0' : 'opacity-100'
                ].join(' ')}
                loading="lazy"
                decoding="async"
                ref={imgRef}
                onLoad={() => setMediaLoaded(true)}
                onError={() => { setMediaError(true); setMediaLoaded(true); }}
                aria-hidden={hideMedia}
              />
              {(!mediaLoaded && !mediaError && !hideMedia) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-[#ff4500] border-t-transparent animate-spin" aria-label="Loading image" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">📰</div>
          )}

          {/* Prominent Upvotes Badge */}
          <div className="absolute top-2 left-2 z-10">
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur border border-[#ff4500]/30 shadow-lg"
              aria-label={revealed ? `${post.score.toLocaleString()} upvotes` : 'Upvotes hidden'}
            >
              <img
                src={upvoteIcon}
                alt="upvote"
                className="w-4 h-4 sm:w-5 sm:h-5 select-none"
                aria-hidden
                draggable={false}
              />
              {revealed ? (
                animateOnReveal ? (
                  <CountUpNumber
                    value={post.score}
                    className="text-sm sm:text-lg font-extrabold tracking-tight text-[#1a1a1b] font-mono"
                  />
                ) : (
                  <span className="text-sm sm:text-lg font-extrabold tracking-tight text-[#1a1a1b] font-mono" aria-hidden>
                    {post.score.toLocaleString()}
                  </span>
                )
              ) : (
                <span className="text-sm sm:text-lg font-extrabold tracking-tight text-[#1a1a1b] font-mono" aria-hidden>
                  {'???'}
                </span>
              )}
              <span className="text-[10px] sm:text-xs font-semibold text-[#7c7c7c]" aria-hidden>
                upvotes
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-5 pt-1 flex flex-col gap-2 text-left">
          <div className="text-sm sm:text-base font-bold text-[#1a1a1b] break-words whitespace-normal">{post.title}</div>
          <div className="flex items-center justify-between text-xs text-[#7c7c7c]">
            <span>u/{post.author ?? 'unknown'}</span>
          </div>
        </div>

        {revealed && (
          <div className="absolute inset-0 rounded-[inherit] ring-2 ring-white/20 pointer-events-none" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay" />
      </div>
    </button>
  );
};
