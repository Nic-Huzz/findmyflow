/**
 * IconGrid - Reusable selectable icon grid component
 *
 * Used across quest inputs for selecting emotions, methods, triggers,
 * body locations, etc.
 */

import './IconGrid.css'

/**
 * @param {Object} props
 * @param {Array} props.items - Array of { id, label, icon, description? }
 * @param {string|Array} props.selected - Selected item id(s)
 * @param {Function} props.onSelect - Callback when item is selected
 * @param {boolean} [props.multiSelect] - Allow multiple selections
 * @param {number} [props.columns] - Number of grid columns (default: 3)
 * @param {string} [props.variant] - Visual variant: 'default' | 'compact' | 'large'
 * @param {string} [props.colorScheme] - Color scheme: 'purple' | 'pink' | 'red' | 'blue'
 * @param {string} [props.className] - Additional CSS class
 */
function IconGrid({
  items,
  selected,
  onSelect,
  multiSelect = false,
  columns = 3,
  variant = 'default',
  colorScheme = 'purple',
  className = ''
}) {
  const handleClick = (itemId) => {
    if (multiSelect) {
      // Toggle item in array
      const selectedArray = Array.isArray(selected) ? selected : []
      if (selectedArray.includes(itemId)) {
        onSelect(selectedArray.filter(id => id !== itemId))
      } else {
        onSelect([...selectedArray, itemId])
      }
    } else {
      // Single select
      onSelect(itemId)
    }
  }

  const isSelected = (itemId) => {
    if (multiSelect) {
      return Array.isArray(selected) && selected.includes(itemId)
    }
    return selected === itemId
  }

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`
  }

  return (
    <div
      className={`icon-grid icon-grid--${variant} icon-grid--${colorScheme} ${className}`}
      style={gridStyle}
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`icon-grid-item ${isSelected(item.id) ? 'selected' : ''}`}
          onClick={() => handleClick(item.id)}
          title={item.description}
        >
          <span className="icon-grid-icon">{item.icon}</span>
          <span className="icon-grid-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default IconGrid
