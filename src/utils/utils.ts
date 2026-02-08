export const truncateText = (text = "", max = 18) =>
    text.length > max ? `${text.slice(0, max)}...` : text;