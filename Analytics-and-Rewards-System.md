# Analytics System for Carstarz

## Leveraging the Knowledge Graph for Value Metrics

Our relational database model provides a rich foundation for analytics. By analyzing the connections between entities and the value created through these relationships, we can gain insights into platform usage and user behavior.

## Key Value Metrics Based on Knowledge Graph Relationships

### 1. Vehicle Owner Metrics

| Metric | Description | Calculation | Database Relationships Used |
|--------|-------------|-------------|---------------------------|
| Profile Completeness | How complete a vehicle profile is | % of optional fields completed | vehicle_profiles, vehicle_media, vehicle_specs |
| Media Quality | Quality of vehicle media | Engagement + professional rating | user_media, likes, comments |
| Modification Depth | Extent of vehicle modifications | Count and complexity of mods | vehicle_modifications, modification_installers |
| Community Engagement | How active the owner is | Interactions + contributions | comments, likes, follows |
| Vehicle Popularity | How popular the vehicle is | Views + likes + shares | views, likes, shares |

### 2. Builder Metrics

| Metric | Description | Calculation | Database Relationships Used |
|--------|-------------|-------------|---------------------------|
| Build Volume | Number of vehicles worked on | Count of builder relationships | builders, vehicle_modifications |
| Build Complexity | Complexity of builds | Avg. modification complexity | parts_installed, modifications |
| Customer Satisfaction | Customer ratings | Avg. rating from vehicle owners | builder_ratings |
| Portfolio Quality | Quality of build portfolio | Engagement on builds | builders, likes |
| Specialization Score | Expertise in specific areas | Frequency of specific mod types | builder_specializations |

### 3. Parts and Brands Metrics

| Metric | Description | Calculation | Database Relationships Used |
|--------|-------------|-------------|---------------------------|
| Installation Frequency | How often a part is used | Count of installations | part_installations |
| Brand Reputation | Brand reputation score | Ratings + recommendations | brands, brand_recommendations |
| Performance Impact | Impact on vehicle performance | Before/after performance data | performance_metrics |
| Compatibility Range | Range of compatible vehicles | Count of compatible vehicles | part_compatibility |
| Value Impact | Impact on vehicle value | Avg. value change after install | value_assessments |

### 4. Community Metrics

| Metric | Description | Calculation | Database Relationships Used |
|--------|-------------|-------------|---------------------------|
| Club Activity | Activity level of clubs | Member count + post frequency | club_members, posts |
| Show Participation | Show participation level | Count of shows entered | show_entries, featured_vehicles |
| Influence Score | User influence in community | Follower count + engagement | followers, user_engagement |
| Content Creation | Content creation volume | Media + comments + posts | user_media, comments, posts |
| Network Centrality | Position in social network | SQL relationship analysis | All social relationship tables |

## Analytics Implementation

### 1. Graph Database Queries

To implement these analytics, we'll use SQL queries that leverage our relational database structure:

```sql
-- Example SQL query to calculate vehicle popularity
SELECT
  v.token_id, v.make, v.model, v.year,
  COUNT(i.id) AS interactions,
  SUM(CASE WHEN i.type = 'like' THEN 3 ELSE 0 END) AS like_score,
  SUM(CASE WHEN i.type = 'share' THEN 5 ELSE 0 END) AS share_score,
  SUM(CASE WHEN i.type = 'view' THEN 1 ELSE 0 END) AS view_score
FROM
  vehicles v
LEFT JOIN
  interactions i ON v.token_id = i.vehicle_id
GROUP BY
  v.token_id, v.make, v.model, v.year
ORDER BY
  (like_score + share_score + view_score) DESC
LIMIT 100;
```

### 2. Real-time Analytics Pipeline

We'll implement a real-time analytics pipeline using:

1. **Event Streaming**: Capture all user interactions as events
2. **Stream Processing**: Process events in real-time to update metrics
3. **Time-Series Database**: Store historical metrics for trend analysis
4. **Analytics Dashboard**: Visualize metrics for users and admins

```typescript
// packages/nextjs/services/analytics/eventCapture.ts
export async function captureEvent(
  eventType: string,
  actor: string,
  target: string,
  metadata: Record<string, any>
) {
  try {
    // Create event object
    const event = {
      eventType,
      actor,
      target,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    // Store event in database
    const { error } = await supabase
      .from('events')
      .insert(event);
      
    if (error) throw error;
    
    // Publish event to stream processor
    await publishToEventStream(event);
    
    return { success: true };
  } catch (error) {
    console.error('Event capture error:', error);
    return { success: false, error };
  }
}
```

### 3. Analytics Dashboard Components

```tsx
// packages/nextjs/components/analytics/VehicleAnalytics.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '~/lib/auth/AuthContext';
import { Line, Bar, Radar } from 'react-chartjs-2';

export function VehicleAnalytics({ tokenId }: { tokenId: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('month');
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/analytics/vehicle/${tokenId}?timeframe=${timeframe}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setData(data);
      } catch (error: any) {
        console.error('Analytics error:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [tokenId, timeframe]);
  
  if (loading) {
    return <div>Loading analytics...</div>;
  }
  
  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }
  
  if (!data) {
    return <div>No analytics data available</div>;
  }
  
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Vehicle Analytics</h2>
        
        <div className="flex justify-end mb-4">
          <div className="btn-group">
            <button 
              className={`btn ${timeframe === 'week' ? 'btn-active' : ''}`}
              onClick={() => setTimeframe('week')}
            >
              Week
            </button>
            <button 
              className={`btn ${timeframe === 'month' ? 'btn-active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              Month
            </button>
            <button 
              className={`btn ${timeframe === 'year' ? 'btn-active' : ''}`}
              onClick={() => setTimeframe('year')}
            >
              Year
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2">Profile Views</h3>
            <div className="h-64">
              <Line data={data.viewsData} options={data.viewsOptions} />
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Engagement</h3>
            <div className="h-64">
              <Bar data={data.engagementData} options={data.engagementOptions} />
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Performance Metrics</h3>
            <div className="h-64">
              <Radar data={data.performanceData} options={data.performanceOptions} />
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Community Standing</h3>
            <div className="stat-value text-center text-4xl mt-4">{data.rank}</div>
            <p className="text-center">Ranked #{data.rank} of {data.totalVehicles}</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Top {data.percentile}%</span>
                <span>Category: {data.category}</span>
              </div>
              <progress 
                className="progress progress-primary w-full mt-1" 
                value={100 - data.percentile} 
                max="100"
              ></progress>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-bold mb-2">Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Score</th>
                  <th>Percentile</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.metrics.map((metric: any) => (
                  <tr key={metric.name}>
                    <td>{metric.name}</td>
                    <td>{metric.score}</td>
                    <td>Top {metric.percentile}%</td>
                    <td>
                      {metric.trend === 'up' && <span className="text-success">↑</span>}
                      {metric.trend === 'down' && <span className="text-error">↓</span>}
                      {metric.trend === 'stable' && <span className="text-info">→</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Conclusion

By implementing this analytics system, we can:

1. **Measure Platform Usage**: Track how users interact with the platform
2. **Generate Insights**: Use analytics to inform product decisions
3. **Identify Trends**: Understand emerging patterns in user behavior
4. **Improve User Experience**: Make data-driven decisions to enhance the platform

The system is designed to be scalable, with the ability to add new metrics as the platform evolves. By leveraging our relational database model with well-designed tables and relationships, we can create a rich, interconnected analytics system that captures valuable insights about user interactions.