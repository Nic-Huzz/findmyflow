/**
 * StoryMiner Component
 * Extract stories from screenshots (testimonials, DMs) and mine content history
 */
import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { STORY_CATEGORIES, saveStory } from '../../lib/storyBank'
import './StoryMiner.css'

const MINING_SOURCES = [
  { id: 'screenshot', name: 'Screenshot', icon: '📸', description: 'Upload testimonial or DM screenshot' },
  { id: 'content', name: 'Content History', icon: '📝', description: 'Mine stories from your past posts' }
]

export default function StoryMiner({ onClose, onStoryExtracted }) {
  const { user } = useAuth()
  const [source, setSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Screenshot upload state
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Extracted stories state
  const [extractedStories, setExtractedStories] = useState([])
  const [savingStory, setSavingStory] = useState(null)

  // Content mining state
  const [contentToMine, setContentToMine] = useState([])
  const [selectedContent, setSelectedContent] = useState([])

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleExtractFromScreenshot() {
    if (!imageFile) return

    setLoading(true)
    setError(null)

    try {
      // Upload image to get base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(imageFile)
      })
      const base64Image = await base64Promise

      // Call edge function to extract story
      const { data, error: fnError } = await supabase.functions.invoke('extract-story-from-image', {
        body: {
          image: base64Image,
          userId: user.id
        }
      })

      if (fnError) throw fnError

      if (data?.stories) {
        setExtractedStories(data.stories)
      } else {
        setError('No stories could be extracted from this image')
      }
    } catch (err) {
      console.error('Error extracting story:', err)
      setError('Failed to extract story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadContentHistory() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('content_history')
        .select('id, content, content_type, platform, created_at')
        .eq('user_id', user.id)
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(50)

      setContentToMine(data || [])
    } catch (err) {
      console.error('Error loading content:', err)
      setError('Failed to load content history')
    } finally {
      setLoading(false)
    }
  }

  async function handleMineContent() {
    if (selectedContent.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const contentTexts = selectedContent.map(id => {
        const content = contentToMine.find(c => c.id === id)
        return content?.content
      }).filter(Boolean)

      // Call edge function to mine stories from content
      const { data, error: fnError } = await supabase.functions.invoke('mine-stories-from-content', {
        body: {
          contents: contentTexts,
          userId: user.id
        }
      })

      if (fnError) throw fnError

      if (data?.stories) {
        setExtractedStories(data.stories)
      } else {
        setError('No reusable stories found in selected content')
      }
    } catch (err) {
      console.error('Error mining content:', err)
      setError('Failed to mine stories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveStory(story, index) {
    setSavingStory(index)
    try {
      await saveStory(user.id, story.category, story.content, story.title)

      // Remove from extracted list
      setExtractedStories(prev => prev.filter((_, i) => i !== index))

      if (onStoryExtracted) {
        onStoryExtracted(story)
      }
    } catch (err) {
      console.error('Error saving story:', err)
      setError('Failed to save story')
    } finally {
      setSavingStory(null)
    }
  }

  function toggleContentSelection(id) {
    setSelectedContent(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  // Source Selection
  if (!source) {
    return (
      <div className="story-miner">
        <div className="sm-header">
          <h2>🔍 Story Miner</h2>
          <p>Extract stories from screenshots or your content history</p>
          {onClose && (
            <button className="sm-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="sm-sources">
          {MINING_SOURCES.map(s => (
            <button
              key={s.id}
              className="sm-source-btn"
              onClick={() => {
                setSource(s.id)
                if (s.id === 'content') loadContentHistory()
              }}
            >
              <span className="sm-source-icon">{s.icon}</span>
              <span className="sm-source-name">{s.name}</span>
              <span className="sm-source-desc">{s.description}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Screenshot Upload View
  if (source === 'screenshot' && extractedStories.length === 0) {
    return (
      <div className="story-miner">
        <div className="sm-header">
          <button className="sm-back-btn" onClick={() => setSource(null)}>← Back</button>
          <h2>📸 Screenshot to Story</h2>
          {onClose && (
            <button className="sm-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="sm-upload-area">
          {imagePreview ? (
            <div className="sm-preview">
              <img src={imagePreview} alt="Screenshot preview" />
              <button className="sm-change-btn" onClick={() => {
                setImageFile(null)
                setImagePreview(null)
              }}>
                Change Image
              </button>
            </div>
          ) : (
            <label className="sm-dropzone">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                hidden
              />
              <span className="sm-dropzone-icon">📷</span>
              <span className="sm-dropzone-text">Click to upload screenshot</span>
              <span className="sm-dropzone-hint">DM conversations, testimonials, reviews</span>
            </label>
          )}
        </div>

        {error && <div className="sm-error">{error}</div>}

        <div className="sm-actions">
          <button
            className="sm-extract-btn"
            onClick={handleExtractFromScreenshot}
            disabled={!imageFile || loading}
          >
            {loading ? 'Extracting...' : '✨ Extract Story'}
          </button>
        </div>
      </div>
    )
  }

  // Content Mining View
  if (source === 'content' && extractedStories.length === 0) {
    return (
      <div className="story-miner">
        <div className="sm-header">
          <button className="sm-back-btn" onClick={() => setSource(null)}>← Back</button>
          <h2>📝 Mine Content History</h2>
          {onClose && (
            <button className="sm-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <p className="sm-instruction">
          Select posts that contain stories, wins, or examples you want to reuse:
        </p>

        {loading ? (
          <div className="sm-loading">Loading your content...</div>
        ) : (
          <div className="sm-content-list">
            {contentToMine.length === 0 ? (
              <div className="sm-empty">No posted content found to mine</div>
            ) : (
              contentToMine.map(content => (
                <div
                  key={content.id}
                  className={`sm-content-item ${selectedContent.includes(content.id) ? 'selected' : ''}`}
                  onClick={() => toggleContentSelection(content.id)}
                >
                  <div className="sm-content-check">
                    {selectedContent.includes(content.id) ? '✓' : ''}
                  </div>
                  <div className="sm-content-text">
                    {content.content?.slice(0, 200)}...
                  </div>
                  <div className="sm-content-meta">
                    {content.platform} • {new Date(content.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {error && <div className="sm-error">{error}</div>}

        <div className="sm-actions">
          <button
            className="sm-extract-btn"
            onClick={handleMineContent}
            disabled={selectedContent.length === 0 || loading}
          >
            {loading ? 'Mining...' : `✨ Mine ${selectedContent.length} Posts`}
          </button>
        </div>
      </div>
    )
  }

  // Extracted Stories View
  return (
    <div className="story-miner">
      <div className="sm-header">
        <button className="sm-back-btn" onClick={() => {
          setExtractedStories([])
          setImageFile(null)
          setImagePreview(null)
          setSelectedContent([])
        }}>← Back</button>
        <h2>✨ Extracted Stories</h2>
        {onClose && (
          <button className="sm-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <p className="sm-instruction">
        {extractedStories.length} {extractedStories.length === 1 ? 'story' : 'stories'} found.
        Review and save the ones you want:
      </p>

      <div className="sm-extracted-list">
        {extractedStories.map((story, index) => {
          const config = STORY_CATEGORIES[story.category]
          return (
            <div key={index} className="sm-extracted-story">
              <div className="sm-story-header">
                <span className="sm-story-category">
                  {config?.icon} {config?.label || story.category}
                </span>
                {story.title && <span className="sm-story-title">{story.title}</span>}
              </div>
              <p className="sm-story-content">{story.content}</p>
              <div className="sm-story-actions">
                <button
                  className="sm-save-btn"
                  onClick={() => handleSaveStory(story, index)}
                  disabled={savingStory === index}
                >
                  {savingStory === index ? 'Saving...' : '💾 Save to Bank'}
                </button>
                <button
                  className="sm-skip-btn"
                  onClick={() => setExtractedStories(prev => prev.filter((_, i) => i !== index))}
                >
                  Skip
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {extractedStories.length === 0 && (
        <div className="sm-all-saved">
          <span className="sm-success-icon">✅</span>
          <p>All stories saved!</p>
          <button className="sm-done-btn" onClick={onClose}>Done</button>
        </div>
      )}
    </div>
  )
}
