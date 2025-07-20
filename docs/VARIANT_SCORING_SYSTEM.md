# Variant Scoring System Documentation

## Overview

The LP Creator platform includes an intelligent variant scoring system that automatically evaluates and ranks different landing page design variations based on business context, industry fit, design quality, and content structure. This system helps users select the most appropriate design variant for their specific needs.

## Architecture

### Core Components

- **`variantScoringUtils.ts`**: Main scoring algorithms and utilities
- **`calculateDetailedVariantScore()`**: Comprehensive scoring function
- **`compareVariants()`**: Multi-variant comparison and ranking
- **Business Context Analysis**: Industry and goal-specific optimization

## Scoring Criteria

### 1. Business Alignment (30 points max)

Evaluates how well the variant aligns with specific business goals:

| Business Goal | Modern Clean | Conversion Optimized | Content Rich |
|---------------|--------------|---------------------|--------------|
| ブランド認知 | 25 | 10 | 22 |
| リード獲得 | 15 | 28 | 20 |
| 売上向上 | 12 | 30 | 16 |
| 情報提供 | 20 | 12 | 28 |
| 採用 | 20 | 18 | 26 |

### 2. Industry Fit (25 points max)

Assesses compatibility with industry-specific requirements:

| Industry | Modern Clean | Conversion Optimized | Content Rich |
|----------|--------------|---------------------|--------------|
| SaaS | 22 | 23 | 18 |
| E-commerce | 18 | 25 | 16 |
| Education | 17 | 15 | 25 |
| Healthcare | 17 | 20 | 24 |
| Creative | 25 | 18 | 20 |

### 3. Design Quality (25 points max)

Evaluates technical and visual design aspects:

- **HTML Structure Quality** (up to 7 points)
  - Semantic HTML elements usage
  - Proper heading hierarchy
  - Image alt attributes
  
- **CSS Quality** (up to 6 points)
  - CSS variables usage
  - Responsive design indicators
  - Modern CSS properties (grid, flex, transform)
  
- **Responsive Design** (up to 4 points)
  - Tailwind responsive classes
  - Media queries
  - Viewport optimization

### 4. Content Quality (20 points max)

Assesses content structure and accessibility:

- **Content Structure** (up to 5 points)
  - Appropriate content length (200-5000 characters)
  - Section diversity (hero, features, testimonials, etc.)
  
- **Editable Elements** (up to 3 points)
  - Number of `data-editable-id` elements
  - Edit-friendly structure
  
- **Accessibility** (up to 3 points)
  - ARIA attributes usage
  - Proper buttons and links
  - Form labels

## Design Focus Types

### Modern Clean
- **Best For**: Brand awareness, creative industries, design agencies
- **Characteristics**: Clean aesthetics, modern typography, minimal design
- **Strengths**: Visual appeal, professional appearance, brand building

### Conversion Optimized
- **Best For**: Lead generation, sales, e-commerce
- **Characteristics**: Clear CTAs, conversion-focused layout, persuasive elements
- **Strengths**: High conversion rates, action-oriented design, sales optimization

### Content Rich
- **Best For**: Information sharing, education, consulting
- **Characteristics**: Detailed content, structured information, trust-building elements
- **Strengths**: Information delivery, credibility, educational value

## API Usage

### Basic Scoring

```typescript
import { calculateDetailedVariantScore } from '@/src/mastra/tools/utils/variantScoringUtils';

const businessContext = {
  industry: 'saas',
  targetAudience: '中小企業',
  businessGoal: 'リード獲得',
  competitiveAdvantage: ['高品質', '低価格'],
  tone: 'professional'
};

const result = calculateDetailedVariantScore(variant, businessContext);

console.log(`Score: ${result.score}/100`);
console.log('Breakdown:', result.breakdown);
console.log('Reasoning:', result.reasoning);
```

### Variant Comparison

```typescript
import { compareVariants } from '@/src/mastra/tools/utils/variantScoringUtils';

const variants = [
  modernCleanVariant,
  conversionOptimizedVariant,
  contentRichVariant
];

const comparison = compareVariants(variants, businessContext);

console.log('Best Overall:', comparison.summary.bestOverall);
console.log('Best for Business:', comparison.summary.bestForBusiness);
console.log('Rankings:', comparison.rankings);
```

### User Preferences

```typescript
const result = calculateDetailedVariantScore(variant, businessContext, {
  prioritizeConversion: true,
  prioritizeDesign: false,
  prioritizeContent: false
});
```

## Scoring Algorithm Details

### Business Alignment Calculation

The system uses a matrix-based approach to match design focus with business goals:

```typescript
const goalAlignmentMatrix = {
  'modern-clean': {
    'ブランド認知': 25,
    'リード獲得': 15,
    // ... more mappings
  },
  // ... other design focuses
};
```

### Industry Fit Calculation

Similar matrix approach for industry compatibility:

```typescript
const industryFitMatrix = {
  'modern-clean': {
    'saas': 22,
    'tech': 25,
    // ... more mappings
  },
  // ... other design focuses
};
```

### Quality Analysis

Technical analysis of HTML and CSS:

- **HTML Quality**: Semantic elements, accessibility, structure
- **CSS Quality**: Modern properties, responsive design, maintainability
- **Content Analysis**: Length, structure, editability

## Testing

The scoring system includes comprehensive unit tests:

```bash
npm test tests/unit/variant-scoring-utils.test.ts
```

### Test Coverage

- Basic scoring functionality
- User preference handling
- Business goal variations
- Industry-specific scoring
- HTML/CSS quality analysis
- Edge cases (empty content, unknown industries)

## Performance Considerations

- **Caching**: Scoring results can be cached for identical inputs
- **Batch Processing**: Multiple variants scored efficiently
- **Lightweight Analysis**: Fast HTML/CSS parsing without full DOM rendering

## Future Enhancements

### Planned Features

1. **Machine Learning Integration**: Learn from user selections to improve scoring
2. **A/B Testing Data**: Incorporate real conversion data into scoring
3. **Custom Scoring Weights**: Allow users to customize scoring criteria
4. **Industry-Specific Templates**: Expand industry coverage and specialization
5. **Real-time Scoring**: Live scoring updates during variant generation

### Extensibility

The scoring system is designed for easy extension:

- Add new design focus types
- Expand industry coverage
- Customize scoring criteria
- Integrate external data sources

## Troubleshooting

### Common Issues

1. **Undefined Summary Properties**: Some comparison summary properties may be undefined if no variants match specific criteria
2. **Low Scores**: Check business context alignment and content quality
3. **Inconsistent Rankings**: Verify variant data completeness

### Debug Mode

Enable detailed logging for scoring analysis:

```typescript
// Set debug flag for detailed scoring logs
process.env.DEBUG_VARIANT_SCORING = 'true';
```

## Contributing

When contributing to the scoring system:

1. Add unit tests for new scoring criteria
2. Update documentation for new features
3. Maintain backward compatibility
4. Consider performance impact of new algorithms

## Related Documentation

- [Project Overview](PROJECT_OVERVIEW.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](../tests/README.md)
- [Type Definitions](../src/types/lp-core.ts)