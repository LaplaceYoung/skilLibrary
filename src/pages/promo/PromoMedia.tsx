import React from 'react';

export const PromoHeroMedia: React.FC = () => (
  <div className="promo-media promo-media-hero" aria-hidden="true">
    <div className="promo-media-header">
      <span className="promo-dot promo-dot-red" />
      <span className="promo-dot promo-dot-yellow" />
      <span className="promo-dot promo-dot-green" />
      <span className="promo-media-title">Skill Studio</span>
    </div>
    <div className="promo-media-body">
      <div className="promo-media-sidebar">
        <div className="promo-media-line" />
        <div className="promo-media-line short" />
        <div className="promo-media-line" />
        <div className="promo-media-line medium" />
        <div className="promo-media-line" />
        <div className="promo-media-line short" />
      </div>
      <div className="promo-media-editor">
        <div className="promo-media-chip">Policy</div>
        <div className="promo-code-line" />
        <div className="promo-code-line" />
        <div className="promo-code-line short" />
        <div className="promo-code-line" />
        <div className="promo-code-line medium" />
      </div>
      <div className="promo-media-panel">
        <div className="promo-panel-title">Run</div>
        <div className="promo-panel-row" />
        <div className="promo-panel-row short" />
        <div className="promo-panel-row" />
      </div>
    </div>
    <div className="promo-media-glow" />
  </div>
);

export const PromoFileMedia: React.FC = () => (
  <div className="promo-media promo-media-files" aria-hidden="true">
    <div className="promo-media-header">
      <span className="promo-dot promo-dot-red" />
      <span className="promo-dot promo-dot-yellow" />
      <span className="promo-dot promo-dot-green" />
      <span className="promo-media-title">Workspace</span>
    </div>
    <div className="promo-media-body">
      <div className="promo-media-sidebar">
        <div className="promo-media-line" />
        <div className="promo-media-line short" />
        <div className="promo-media-line" />
        <div className="promo-media-line medium" />
        <div className="promo-media-line" />
        <div className="promo-media-line short" />
        <div className="promo-media-line" />
      </div>
      <div className="promo-media-editor">
        <div className="promo-media-chip">Skill Pack</div>
        <div className="promo-code-line" />
        <div className="promo-code-line medium" />
        <div className="promo-code-line short" />
        <div className="promo-code-line" />
      </div>
    </div>
    <div className="promo-media-glow" />
  </div>
);
