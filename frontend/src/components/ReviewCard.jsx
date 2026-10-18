import {Star,UserRound,Images,Play} from 'lucide-react';

export function Stars({value=0,label}){
 return <span className="stars" title={label||`${value} out of 5`}>{[1,2,3,4,5].map(n=><Star key={n} size={15} fill={n<=value?'currentColor':'none'} className={n<=value?'filled':''}/>)}</span>;
}

export default function ReviewCard({review}){
 const media=review.mediaUrls||[];
 return <article className="review-card">
  <div className="review-head">
   <div className={`review-avatar ${review.touristProfileImageUrl?'has-photo':''}`}>{review.touristProfileImageUrl?<img src={review.touristProfileImageUrl} alt=""/>:<UserRound size={20}/>}</div>
   <div><b>{review.touristName}</b><small>{review.country?`${review.country} • `:''}{review.packageName}</small>{review.demo&&<span className="demo-review-chip">Sample review</span>}</div>
   <div className="review-rating"><Stars value={review.overallRating}/><small>{review.createdAt?new Date(review.createdAt).toLocaleDateString():''}</small></div>
  </div>
  {review.title&&<h3>{review.title}</h3>}
  <p>{review.reviewText}</p>
  {(review.driverRating||review.guideRating)&&<div className="review-subratings">
   {review.driverRating&&<span>Driver <Stars value={review.driverRating}/></span>}
   {review.guideRating&&<span>Guide <Stars value={review.guideRating}/></span>}
  </div>}
  {(review.driverReview||review.guideReview)&&<div className="review-notes">
   {review.driverReview&&<small><b>Driver:</b> {review.driverReview}</small>}
   {review.guideReview&&<small><b>Guide:</b> {review.guideReview}</small>}
  </div>}
  {!!media.length&&<div className="review-media-grid">{media.slice(0,4).map((url,i)=>/\.(mp4|webm)(\?|$)/i.test(url)?<div className="review-media video" key={i}><video src={url} controls preload="metadata"/><Play size={18}/></div>:<img key={i} src={url} alt={`Review media ${i+1}`}/>)}</div>}
 </article>;
}
