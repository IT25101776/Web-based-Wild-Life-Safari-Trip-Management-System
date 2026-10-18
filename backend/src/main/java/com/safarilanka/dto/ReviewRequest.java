package com.safarilanka.dto;
import java.util.List;
public record ReviewRequest(Integer overallRating,Integer driverRating,Integer guideRating,String title,String reviewText,String driverReview,String guideReview,List<String> mediaUrls){}
