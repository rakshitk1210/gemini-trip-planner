import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import imgRakshit from '../assets/rakshit.png';

// Convert a lat/lng to pixel coordinates relative to the map container.
function latLngToPixel(map, lat, lng) {
  try {
    const proj   = map.getProjection();
    const bounds = map.getBounds();
    if (!proj || !bounds) return null;
    const mapDiv = document.getElementById('mapArea');
    if (!mapDiv) return null;
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne);
    const swPt = proj.fromLatLngToPoint(sw);
    const pt   = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
    return {
      x: (pt.x - swPt.x) / (nePt.x - swPt.x) * w,
      y: (pt.y - nePt.y) / (swPt.y - nePt.y) * h,
    };
  } catch { return null; }
}

// ─── Saved comment OverlayView ────────────────────────────────────────────────
let _CommentPin = null;

function initCommentPin() {
  if (_CommentPin) return;
  _CommentPin = class extends google.maps.OverlayView {
    constructor(comment, onClickId, avatarSrc) {
      super();
      this.comment   = comment;
      this.onClickId = onClickId;
      this.avatarSrc = avatarSrc;
    }
    onAdd() {
      const el = document.createElement('div');
      el.className = 'comment-dot';
      const img = document.createElement('img');
      img.src = this.avatarSrc;
      img.alt = '';
      img.className = 'comment-dot-avatar';
      el.appendChild(img);
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.onClickId(this.comment.id);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }
    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.comment.lat, this.comment.lng));
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 16) + 'px';
      this.el.style.top  = Math.round(pt.y - 16) + 'px';
    }
    onRemove() { this.el?.parentNode?.removeChild(this.el); this.el = null; }
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CommentOverlay() {
  const map = useMap();

  const comments        = useAppStore(s => s.comments);
  const pendingComment  = useAppStore(s => s.pendingComment);
  const activeCommentId = useAppStore(s => s.activeCommentId);
  const editingCommentId= useAppStore(s => s.editingCommentId);
  const commentMode     = useAppStore(s => s.commentMode);
  const submitComment   = useAppStore(s => s.submitComment);
  const cancelPendingComment = useAppStore(s => s.cancelPendingComment);
  const toggleCommentMode = useAppStore(s => s.toggleCommentMode);
  const deleteComment   = useAppStore(s => s.deleteComment);
  const startEditComment= useAppStore(s => s.startEditComment);
  const setActiveCommentId = useAppStore(s => s.setActiveCommentId);
  const setReplyContext    = useAppStore(s => s.setReplyContext);
  const isThinking        = useAppStore(s => s.isThinking);

  // Pixel positions for the pending dot and active detail popup
  const [pendingPos, setPendingPos]     = useState(null);
  const [activePos,  setActivePos]      = useState(null);

  // Input state
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  // OverlayView instances for saved comments
  const commentPinsRef = useRef({});

  // ── Compute pending dot position, track map pan/zoom ──────────────────────
  const updatePendingPos = useCallback(() => {
    if (!map || !pendingComment) { setPendingPos(null); return; }
    setPendingPos(latLngToPixel(map, pendingComment.lat, pendingComment.lng));
  }, [map, pendingComment]);

  useEffect(() => {
    updatePendingPos();
    if (!map) return;
    const listeners = [
      map.addListener('bounds_changed', updatePendingPos),
      map.addListener('zoom_changed',   updatePendingPos),
    ];
    return () => listeners.forEach(l => google.maps.event.removeListener(l));
  }, [map, updatePendingPos]);

  // Pre-fill textarea when editing an existing comment
  useEffect(() => {
    if (editingCommentId) {
      const c = comments.find(c => c.id === editingCommentId);
      setInputText(c?.text ?? '');
    } else if (pendingComment && !editingCommentId) {
      setInputText('');
    }
  }, [pendingComment, editingCommentId]);

  // Focus textarea when input card opens
  useEffect(() => {
    if (pendingPos && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [!!pendingPos]);

  // ── Manage OverlayView pins for saved comments ─────────────────────────────
  useEffect(() => {
    if (!map) return;
    initCommentPin();

    const existing = commentPinsRef.current;
    const currentIds = new Set(comments.map(c => c.id));

    // Remove pins for deleted comments
    Object.keys(existing).forEach(id => {
      if (!currentIds.has(id)) {
        existing[id].setMap(null);
        delete existing[id];
      }
    });

    // Add pins for new comments
    comments.forEach(comment => {
      if (!existing[comment.id]) {
        const pin = new _CommentPin(comment, (id) => {
          setActiveCommentId(activeCommentId === id ? null : id);
        }, imgRakshit);
        pin.setMap(map);
        existing[comment.id] = pin;
      }
    });

    return () => {
      Object.values(commentPinsRef.current).forEach(p => p.setMap(null));
      commentPinsRef.current = {};
    };
  }, [map, comments]);

  // Update click handler on pins when activeCommentId changes (stale closure fix)
  useEffect(() => {
    Object.values(commentPinsRef.current).forEach(pin => {
      pin.onClickId = (id) => setActiveCommentId(activeCommentId === id ? null : id);
    });
  }, [activeCommentId]);

  // ── Compute active comment popup position ─────────────────────────────────
  useEffect(() => {
    if (!map || !activeCommentId) { setActivePos(null); return; }
    const comment = comments.find(c => c.id === activeCommentId);
    if (!comment) { setActivePos(null); return; }
    const update = () => setActivePos(latLngToPixel(map, comment.lat, comment.lng));
    update();
    const listeners = [
      map.addListener('bounds_changed', update),
      map.addListener('zoom_changed',   update),
    ];
    return () => listeners.forEach(l => google.maps.event.removeListener(l));
  }, [map, activeCommentId, comments]);

  // ── Close detail popup on outside click ───────────────────────────────────
  useEffect(() => {
    if (!activeCommentId) return;
    const onMouseDown = (e) => {
      if (
        !e.target.closest('.comment-detail-card') &&
        !e.target.closest('.comment-dot')
      ) {
        setActiveCommentId(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [activeCommentId]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      // Escape — always exits comment mode (cancels pending, closes detail)
      if (e.key === 'Escape') {
        if (pendingComment) { cancelPendingComment(); setInputText(''); }
        if (activeCommentId) setActiveCommentId(null);
        if (commentMode) toggleCommentMode();
        return;
      }

      // "C" — toggle comment mode when not typing in a field
      if ((e.key === 'c' || e.key === 'C') && !typing && !e.metaKey && !e.ctrlKey) {
        toggleCommentMode();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingComment, activeCommentId, commentMode]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  const handleInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    submitComment(inputText, editingCommentId || null);
    setInputText('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Pending comment: dot + input card ── */}
      {pendingPos && (
        <>
          <div
            className="comment-dot--pending"
            style={{ left: pendingPos.x - 8, top: pendingPos.y - 8 }}
          />
          <div
            className="comment-input-card"
            style={{
              left: Math.max(8, Math.min(pendingPos.x - 8, (document.getElementById('mapArea')?.offsetWidth ?? 800) - 328)),
              top:  pendingPos.y + 25,
            }}
          >
            <textarea
              ref={textareaRef}
              className="comment-textarea"
              placeholder="Write your comment here..."
              value={inputText}
              onInput={handleInput}
              onChange={handleInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <button
              className="comment-send-btn"
              disabled={!inputText.trim()}
              onClick={handleSend}
            >
              <span className="material-symbols-rounded">send</span>
            </button>
          </div>
        </>
      )}

      {/* ── Active comment detail popup ── */}
      {activePos && activeCommentId && (() => {
        const comment = comments.find(c => c.id === activeCommentId);
        if (!comment) return null;
        const mapW = document.getElementById('mapArea')?.offsetWidth ?? 800;
        return (
          <div
            className="comment-detail-card"
            style={{
              left: Math.max(8, Math.min(activePos.x - 18, mapW - 328)),
              top:  activePos.y + 30,
            }}
          >
            <p className="comment-detail-text">{comment.text}</p>
            <div className="comment-detail-footer">
              <img className="comment-detail-avatar" src={imgRakshit} alt="Author" />
              <div className="comment-detail-actions">
                <button
                  className="comment-action-btn comment-action-btn--delete"
                  title="Delete"
                  onClick={() => deleteComment(comment.id)}
                >
                  <span className="material-symbols-rounded">delete</span>
                </button>
                <button
                  className="comment-action-btn"
                  title="Edit"
                  onClick={() => startEditComment(comment.id)}
                >
                  <span className="material-symbols-rounded">edit</span>
                </button>
                <button
                  className="comment-reply-btn"
                  disabled={isThinking}
                  onClick={() => setReplyContext(comment)}
                >
                  <span className="material-symbols-rounded">reply</span>
                  Reply
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
