/* eslint-disable style/jsx-one-expression-per-line */
import React from 'react'

export function TestComponent() {
  return (
    <div title={(0.1 + 0.2).toString()}>
      <div>{0.1 + 0.2}</div>
      {/* block-ad-ignore */}
      <span title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</span>
      {/* next-ad-ignore */}
      <p title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</p>
      <p>
        {/* next-ad-ignore */}
        skip: {0.1 + 0.2} transform: {1 - 0.9}
      </p>
    </div>
  )
}
