import React from 'react';
import FileCard from './FileCard';

/**
 * SuggestedFileCard delegates directly to FileCard to maintain 100% visual and functional
 * consistency across Recent Files and the primary file grid.
 */
const SuggestedFileCard = (props) => {
  return <FileCard {...props} />;
};

export default React.memo(SuggestedFileCard);


