import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from './config/api';
import {
  FiGift, FiStar, FiUsers, FiAward, FiCopy, FiCheck,
  FiTrendingUp, FiTarget, FiZap, FiShield, FiHeart,
  FiChevronRight, FiClock, FiShare2, FiRefreshCw, FiTag, FiMail, FiEdit3, FiPackage
} from 'react-icons/fi';
import { GiPeanut, GiDiamondHard, GiTrophy, GiLaurelCrown, GiMedal } from 'react-icons/gi';
import { toast } from 'react-hot-toast';

const LoyaltyDashboard = () => {
  const { userId, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);
  const [claimingAchievement, setClaimingAchievement] = useState(null);

  const authFetch = async (url, options = {}) => {
    const token = await getToken();
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    if (isSignedIn && userId) {
      loadLoyaltyData();
    }
  }, [isSignedIn, userId]);

  const loadLoyaltyData = async () => {
    setIsLoading(true);
    try {
      const [loyaltyRes, achievementsRes, rewardsRes, leaderboardRes] = await Promise.all([
        authFetch(API_ENDPOINTS.LOYALTY_USER(userId)),
        authFetch(API_ENDPOINTS.LOYALTY_USER_ACHIEVEMENTS(userId)),
        fetch(API_ENDPOINTS.LOYALTY_REWARDS),
        fetch(API_ENDPOINTS.LOYALTY_LEADERBOARD)
      ]);

      const loyaltyJson = await loyaltyRes.json();
      const achievementsJson = await achievementsRes.json();
      const rewardsJson = await rewardsRes.json();
      const leaderboardJson = await leaderboardRes.json();

      if (loyaltyJson.success) setLoyaltyData(loyaltyJson.data);
      if (achievementsJson.success) setAchievements(achievementsJson.data);
      if (rewardsJson.success) setRewards(rewardsJson.data);
      if (leaderboardJson.success) setLeaderboard(leaderboardJson.data);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
      toast.error('Failed to load loyalty information');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLeaderboard = async () => {
    setIsRefreshingLeaderboard(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOYALTY_LEADERBOARD);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data);
        toast.success('Leaderboard refreshed!');
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
      toast.error('Failed to refresh leaderboard');
    } finally {
      setIsRefreshingLeaderboard(false);
    }
  };

  const handleClaimAchievement = async (achievementId) => {
    setClaimingAchievement(achievementId);
    try {
      const response = await authFetch(API_ENDPOINTS.LOYALTY_CLAIM_ACHIEVEMENT(achievementId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.data.message || `You earned ${data.data.pointsAwarded} points!`);

        // Update achievements list to mark as claimed
        setAchievements(prev => prev.map(a =>
          a.achievementId === achievementId
            ? { ...a, claimed: true, claimedAt: new Date() }
            : a
        ));

        // Update loyalty data with new balance
        setLoyaltyData(prev => ({
          ...prev,
          points: data.data.newBalance
        }));

        // Refresh leaderboard
        refreshLeaderboard();
      } else {
        toast.error(data.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Failed to claim achievement:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaimingAchievement(null);
    }
  };

  const handleSpin = async () => {
    if (!loyaltyData?.canSpin || isSpinning) return;

    setIsSpinning(true);
    setWheelRotation(prev => prev + 1800 + Math.random() * 360);

    try {
      const response = await authFetch(API_ENDPOINTS.LOYALTY_SPIN(userId), {
        method: 'POST'
      });
      const data = await response.json();

      setTimeout(() => {
        if (data.success) {
          setSpinResult(data.data.pointsWon);
          setLoyaltyData(prev => ({
            ...prev,
            points: data.data.newTotal,
            canSpin: false
          }));
          toast.success(`Congratulations! You won ${data.data.pointsWon} points!`);
        } else {
          toast.error(data.error);
        }
        setIsSpinning(false);
      }, 3000);
    } catch (error) {
      toast.error('Failed to spin');
      setIsSpinning(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (loyaltyData.points < reward.pointsCost) {
      toast.error('Not enough points');
      return;
    }

    try {
      const response = await authFetch(API_ENDPOINTS.LOYALTY_REDEEM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          points: reward.pointsCost,
          rewardType: reward.type,
          rewardId: reward.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setLoyaltyData(prev => ({
          ...prev,
          points: data.data.newBalance
        }));

        // Save coupon code to localStorage for auto-apply
        if (data.data.rewardCode) {
          localStorage.setItem('appliedCoupon', JSON.stringify({
            code: data.data.rewardCode,
            type: data.data.rewardType,
            rewardName: data.data.rewardName,
            appliedAt: new Date().toISOString()
          }));

          // Show success message with redirection
          toast.success(
            `${reward.name} redeemed!\n✓ Code: ${data.data.rewardCode}\n\nRedirecting to products...`,
            {
              duration: 3000,
              style: { 
                background: '#4CAF50', 
                color: 'white',
                padding: '16px',
                fontSize: '14px',
                borderRadius: '8px'
              }
            }
          );

          // Redirect to products page after brief delay
          setTimeout(() => {
            window.location.href = '/products';
          }, 1500);
        }
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to redeem reward');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${loyaltyData?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierInfo = (tier) => {
    const tiers = {
      bronze: { color: '#CD7F32', bg: 'linear-gradient(135deg, #CD7F32 0%, #8B5A2B 100%)', icon: <GiMedal />, next: 'Silver', pointsNeeded: 1000 },
      silver: { color: '#C0C0C0', bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', icon: <GiMedal />, next: 'Gold', pointsNeeded: 5000 },
      gold: { color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: <GiLaurelCrown />, next: 'Platinum', pointsNeeded: 15000 },
      platinum: { color: '#E5E4E2', bg: 'linear-gradient(135deg, #E5E4E2 0%, #B8B8B8 100%)', icon: <GiDiamondHard />, next: null, pointsNeeded: null }
    };
    return tiers[tier] || tiers.bronze;
  };

  const tierInfo = getTierInfo(loyaltyData?.tier);

  if (!isSignedIn) {
    return (
      <Container>
        <LoginPromptSection>
          <LoginPromptContent>
            <LoginIcon><FiGift /></LoginIcon>
            <h1>Join Our Rewards Program</h1>
            <p>Sign in to earn points on every purchase, unlock exclusive achievements, and redeem amazing rewards!</p>
            <BenefitsList>
              <BenefitItem>
                <BenefitIcon><FiGift /></BenefitIcon>
                <div>
                  <h4>Earn Points</h4>
                  <span>Get 1 point for every ₹10 spent</span>
                </div>
              </BenefitItem>
              <BenefitItem>
                <BenefitIcon><FiAward /></BenefitIcon>
                <div>
                  <h4>Unlock Achievements</h4>
                  <span>Complete challenges for bonus rewards</span>
                </div>
              </BenefitItem>
              <BenefitItem>
                <BenefitIcon><FiUsers /></BenefitIcon>
                <div>
                  <h4>Refer Friends</h4>
                  <span>Earn 200 points per referral</span>
                </div>
              </BenefitItem>
            </BenefitsList>
            <LoginButton to="/login">
              Sign In to Get Started <FiChevronRight />
            </LoginButton>
          </LoginPromptContent>
        </LoginPromptSection>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <HeroSkeleton>
          <SkeletonPulse style={{ width: '120px', height: '32px', borderRadius: '20px' }} />
          <SkeletonPulse style={{ width: '200px', height: '60px', margin: '16px 0' }} />
          <SkeletonPulse style={{ width: '150px', height: '20px' }} />
        </HeroSkeleton>
        <ContentSkeleton>
          <SkeletonPulse style={{ width: '100%', height: '200px', borderRadius: '20px' }} />
        </ContentSkeleton>
      </Container>
    );
  }

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroPattern />
        <HeroContent>
          <UserGreeting>
            <UserAvatar>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.firstName} />
              ) : (
                <span>{user?.firstName?.charAt(0) || 'U'}</span>
              )}
            </UserAvatar>
            <div>
              <WelcomeText>Welcome back,</WelcomeText>
              <UserName>{user?.firstName || 'Member'}</UserName>
            </div>
          </UserGreeting>

          <HeroMainContent>
            <PointsCard>
              <TierSection>
                <TierBadge $bg={tierInfo.bg}>
                  <span className="icon">{tierInfo.icon}</span>
                  <span className="tier">{loyaltyData?.tier?.toUpperCase()}</span>
                </TierBadge>
                {tierInfo.next && (
                  <NextTier>
                    <FiTrendingUp /> {tierInfo.pointsNeeded - (loyaltyData?.lifetimePoints || 0)} pts to {tierInfo.next}
                  </NextTier>
                )}
              </TierSection>

              <MainPoints>
                <PointsNumber>{loyaltyData?.points || 0}</PointsNumber>
                <PointsLabel>Available Points</PointsLabel>
              </MainPoints>

              <PointsStats>
                <PointsStat>
                  <span className="value">{loyaltyData?.lifetimePoints || 0}</span>
                  <span className="label">Lifetime Earned</span>
                </PointsStat>
                <StatDivider />
                <PointsStat>
                  <span className="value">{loyaltyData?.stats?.totalOrders || 0}</span>
                  <span className="label">Orders Made</span>
                </PointsStat>
                <StatDivider />
                <PointsStat>
                  <span className="value">{achievements.filter(a => a.unlocked).length}</span>
                  <span className="label">Achievements</span>
                </PointsStat>
              </PointsStats>
            </PointsCard>

            {/* Daily Spin Wheel */}
            <SpinSection>
              <SpinTitle>Daily Spin Wheel</SpinTitle>
              <SpinWheel $rotation={wheelRotation} $spinning={isSpinning}>
                <WheelInner>
                  {spinResult ? (
                    <SpinResultDisplay>
                      <span className="plus">+</span>
                      <span className="points">{spinResult}</span>
                      <span className="label">Points!</span>
                    </SpinResultDisplay>
                  ) : (
                    <>
                      <WheelIcon>{isSpinning ? <FiRefreshCw className="spinning" /> : <FiTarget />}</WheelIcon>
                      <WheelText>{isSpinning ? '...' : loyaltyData?.canSpin ? 'SPIN' : 'DONE'}</WheelText>
                    </>
                  )}
                </WheelInner>
              </SpinWheel>
              <SpinInfo>
                <h3>{loyaltyData?.canSpin ? 'Try your luck!' : 'Come back tomorrow!'}</h3>
                <SpinButton
                  onClick={handleSpin}
                  disabled={!loyaltyData?.canSpin || isSpinning}
                  $available={loyaltyData?.canSpin}
                >
                  {isSpinning ? 'Spinning...' : loyaltyData?.canSpin ? 'Spin Now' : 'Claimed Today'}
                </SpinButton>
              </SpinInfo>
            </SpinSection>
          </HeroMainContent>
        </HeroContent>
      </HeroSection>

      {/* Tabs Navigation */}
      <TabsWrapper>
        <TabsNav>
          {[
            { id: 'overview', icon: <FiStar />, label: 'Overview' },
            { id: 'rewards', icon: <FiGift />, label: 'Rewards' },
            { id: 'achievements', icon: <FiAward />, label: 'Achievements' },
            { id: 'referral', icon: <FiUsers />, label: 'Referral' }
          ].map(tab => (
            <TabButton
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabButton>
          ))}
        </TabsNav>
      </TabsWrapper>

      {/* Tab Content */}
      <ContentSection>
        {activeTab === 'overview' && (
          <OverviewContent>
            {/* Quick Stats */}
            <QuickStatsGrid>
              <QuickStatCard $color="#10B981">
                <QuickStatIcon><FiZap /></QuickStatIcon>
                <QuickStatInfo>
                  <span className="value">{loyaltyData?.points || 0}</span>
                  <span className="label">Points Balance</span>
                </QuickStatInfo>
              </QuickStatCard>
              <QuickStatCard $color="#6366F1">
                <QuickStatIcon><FiTarget /></QuickStatIcon>
                <QuickStatInfo>
                  <span className="value">{loyaltyData?.badges?.length || 0}</span>
                  <span className="label">Badges Earned</span>
                </QuickStatInfo>
              </QuickStatCard>
              <QuickStatCard $color="#F59E0B">
                <QuickStatIcon><FiUsers /></QuickStatIcon>
                <QuickStatInfo>
                  <span className="value">{loyaltyData?.stats?.totalReferrals || 0}</span>
                  <span className="label">Referrals</span>
                </QuickStatInfo>
              </QuickStatCard>
              <QuickStatCard $color="#EC4899">
                <QuickStatIcon><FiHeart /></QuickStatIcon>
                <QuickStatInfo>
                  <span className="value">{tierInfo.icon}</span>
                  <span className="label">{loyaltyData?.tier} Member</span>
                </QuickStatInfo>
              </QuickStatCard>
            </QuickStatsGrid>

            {/* Tier Progress */}
            {tierInfo.next && (
              <TierProgressCard>
                <TierProgressHeader>
                  <h3>Tier Progress</h3>
                  <TierProgressBadge>
                    {Math.round(((loyaltyData?.lifetimePoints || 0) / tierInfo.pointsNeeded) * 100)}% Complete
                  </TierProgressBadge>
                </TierProgressHeader>
                <TierProgressVisual>
                  <CurrentTierIcon>{tierInfo.icon}</CurrentTierIcon>
                  <TierProgressBarWrapper>
                    <TierProgressBar $progress={((loyaltyData?.lifetimePoints || 0) / tierInfo.pointsNeeded) * 100} />
                  </TierProgressBarWrapper>
                  <NextTierIcon>
                    {getTierInfo(tierInfo.next.toLowerCase()).icon}
                  </NextTierIcon>
                </TierProgressVisual>
                <TierProgressLabels>
                  <span>{loyaltyData?.tier?.charAt(0).toUpperCase() + loyaltyData?.tier?.slice(1)}</span>
                  <span>{tierInfo.pointsNeeded - (loyaltyData?.lifetimePoints || 0)} pts needed</span>
                  <span>{tierInfo.next}</span>
                </TierProgressLabels>
              </TierProgressCard>
            )}

            {/* Leaderboard */}
            <LeaderboardCard>
              <LeaderboardHeader>
                <h3><FiTrendingUp /> Top Members</h3>
                <LeaderboardActions>
                  <RefreshButton
                    onClick={refreshLeaderboard}
                    disabled={isRefreshingLeaderboard}
                    $isRefreshing={isRefreshingLeaderboard}
                  >
                    <FiRefreshCw />
                  </RefreshButton>
                  <LeaderboardBadge>This Month</LeaderboardBadge>
                </LeaderboardActions>
              </LeaderboardHeader>
              <LeaderboardList>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <LeaderboardItem key={index} $isUser={entry.userId === userId} $rank={index + 1}>
                    <RankBadge $rank={index + 1}>
                      {index < 3 ? ['1st', '2nd', '3rd'][index] : `#${entry.rank}`}
                    </RankBadge>
                    <LeaderboardUserInfo>
                      <LeaderboardAvatar $tier={entry.tier}>
                        {entry.userName?.charAt(0) || 'U'}
                      </LeaderboardAvatar>
                      <div>
                        <LeaderboardName>{entry.userName} {entry.userId === userId && '(You)'}</LeaderboardName>
                        <LeaderboardTier $color={getTierInfo(entry.tier).color}>
                          {getTierInfo(entry.tier).icon} {entry.tier}
                        </LeaderboardTier>
                      </div>
                    </LeaderboardUserInfo>
                    <LeaderboardPoints>{entry.lifetimePoints.toLocaleString()} pts</LeaderboardPoints>
                  </LeaderboardItem>
                ))}
              </LeaderboardList>
            </LeaderboardCard>
          </OverviewContent>
        )}

        {activeTab === 'rewards' && (
          <RewardsContent>
            <RewardsHeader>
              <h2>Redeem Your Points</h2>
              <PointsBadge>
                <FiZap /> {loyaltyData?.points || 0} Points Available
              </PointsBadge>
            </RewardsHeader>
            <RewardsGrid>
              {(rewards.length > 0 ? rewards : [
                { id: 1, name: '₹50 Off', description: 'Get ₹50 off your next order', pointsCost: 500, icon: 'tag', type: 'discount' },
                { id: 2, name: '₹100 Off', description: 'Get ₹100 off your next order', pointsCost: 900, icon: 'tag', type: 'discount' },
                { id: 3, name: 'Free Shipping', description: 'Free shipping on your next order', pointsCost: 300, icon: 'package', type: 'shipping' },
                { id: 4, name: 'Premium Sample', description: 'Try our premium cashew sample', pointsCost: 400, icon: 'peanut', type: 'product' },
                { id: 5, name: '₹200 Off', description: 'Get ₹200 off orders above ₹1000', pointsCost: 1500, icon: 'tag', type: 'discount' },
                { id: 6, name: 'Mystery Box', description: 'Get a surprise gift with your order', pointsCost: 2000, icon: 'gift', type: 'gift' }
              ]).map((reward) => {
                const canRedeem = loyaltyData?.points >= reward.pointsCost;
                const getRewardIcon = (iconName) => {
                  const icons = {
                    tag: <FiTag />,
                    package: <FiPackage />,
                    peanut: <GiPeanut />,
                    gift: <FiGift />
                  };
                  return icons[iconName] || <FiGift />;
                };
                return (
                  <RewardCard key={reward.id} $canRedeem={canRedeem}>
                    <RewardIconWrapper>
                      <span>{getRewardIcon(reward.icon)}</span>
                    </RewardIconWrapper>
                    <RewardInfo>
                      <RewardName>{reward.name}</RewardName>
                      <RewardDescription>{reward.description}</RewardDescription>
                      <RewardCost>
                        <FiStar /> {reward.pointsCost} points
                      </RewardCost>
                    </RewardInfo>
                    <RedeemButton
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem}
                      $canRedeem={canRedeem}
                    >
                      {canRedeem ? 'Redeem' : `Need ${reward.pointsCost - loyaltyData?.points} more`}
                    </RedeemButton>
                  </RewardCard>
                );
              })}
            </RewardsGrid>
          </RewardsContent>
        )}

        {activeTab === 'achievements' && (
          <AchievementsContent>
            <AchievementsHeader>
              <h2>Your Achievements</h2>
              <AchievementStats>
                <span className="unlocked">{achievements.filter(a => a.unlocked).length} Unlocked</span>
                <span className="separator">/</span>
                <span className="total">{achievements.length} Total</span>
              </AchievementStats>
            </AchievementsHeader>
            <AchievementsGrid>
              {(achievements.length > 0 ? achievements : [
                { achievementId: '1', name: 'First Purchase', description: 'Make your first order', icon: 'cart', unlocked: true, progress: 100, reward: { points: 50 }, rarity: 'common' },
                { achievementId: '2', name: 'Loyal Customer', description: 'Place 5 orders', icon: 'star', unlocked: false, progress: 40, currentValue: 2, target: 5, reward: { points: 200 }, rarity: 'uncommon' },
                { achievementId: '3', name: 'Big Spender', description: 'Spend ₹5000 total', icon: 'diamond', unlocked: false, progress: 30, currentValue: 1500, target: 5000, reward: { points: 500 }, rarity: 'rare' },
                { achievementId: '4', name: 'Social Butterfly', description: 'Refer 3 friends', icon: 'users', unlocked: false, progress: 0, currentValue: 0, target: 3, reward: { points: 300 }, rarity: 'uncommon' },
                { achievementId: '5', name: 'Review Master', description: 'Write 5 product reviews', icon: 'edit', unlocked: false, progress: 20, currentValue: 1, target: 5, reward: { points: 150 }, rarity: 'uncommon' },
                { achievementId: '6', name: 'Cashew Connoisseur', description: 'Try 10 different products', icon: 'peanut', unlocked: false, progress: 10, currentValue: 1, target: 10, reward: { points: 400 }, rarity: 'epic' }
              ]).map((achievement) => {
                const getAchievementIcon = (iconName) => {
                  const icons = {
                    cart: <FiPackage />,
                    star: <FiStar />,
                    diamond: <GiDiamondHard />,
                    users: <FiUsers />,
                    edit: <FiEdit3 />,
                    peanut: <GiPeanut />
                  };
                  return icons[iconName] || <FiAward />;
                };
                return (
                <AchievementCard key={achievement.achievementId} $unlocked={achievement.unlocked} $rarity={achievement.rarity}>
                  <AchievementRarityStripe $rarity={achievement.rarity} />
                  <AchievementIconWrapper $unlocked={achievement.unlocked}>
                    <span>{getAchievementIcon(achievement.icon)}</span>
                    {achievement.unlocked && <UnlockedBadge><FiCheck /></UnlockedBadge>}
                  </AchievementIconWrapper>
                  <AchievementDetails>
                    <AchievementName>{achievement.name}</AchievementName>
                    <AchievementDesc>{achievement.description}</AchievementDesc>
                    {!achievement.unlocked && (
                      <AchievementProgress>
                        <ProgressBarWrapper>
                          <AchievementProgressBar $progress={achievement.progress} $rarity={achievement.rarity} />
                        </ProgressBarWrapper>
                        <ProgressText>{achievement.currentValue}/{achievement.target}</ProgressText>
                      </AchievementProgress>
                    )}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <UnlockedText>
                        <FiCheck /> Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </UnlockedText>
                    )}
                  </AchievementDetails>
                  <AchievementRewardSection>
                    <AchievementReward $unlocked={achievement.unlocked} $claimed={achievement.claimed}>
                      <span className="points">+{achievement.reward?.points || achievement.reward?.value || 0}</span>
                      <span className="label">pts</span>
                    </AchievementReward>
                    {achievement.unlocked && !achievement.claimed && (
                      <ClaimButton
                        onClick={() => handleClaimAchievement(achievement.achievementId)}
                        disabled={claimingAchievement === achievement.achievementId}
                      >
                        {claimingAchievement === achievement.achievementId ? 'Claiming...' : 'Claim'}
                      </ClaimButton>
                    )}
                    {achievement.claimed && (
                      <ClaimedBadge>
                        <FiCheck /> Claimed
                      </ClaimedBadge>
                    )}
                  </AchievementRewardSection>
                </AchievementCard>
              )})}
            </AchievementsGrid>
          </AchievementsContent>
        )}

        {activeTab === 'referral' && (
          <ReferralContent>
            <ReferralHero>
              <ReferralHeroIcon><FiGift /></ReferralHeroIcon>
              <h2>Invite Friends & Earn Rewards!</h2>
              <p>Share the cashew love! Get <strong>200 points</strong> for each friend who makes their first purchase. They get <strong>100 points</strong> too!</p>
            </ReferralHero>

            <ReferralCodeCard>
              <ReferralCodeLabel>Your Referral Code</ReferralCodeLabel>
              <ReferralCodeDisplay>
                <ReferralCodeText>{loyaltyData?.referralCode || 'LOADING...'}</ReferralCodeText>
                <CopyButton onClick={copyReferralLink} $copied={copied}>
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </CopyButton>
              </ReferralCodeDisplay>
              <ShareButtons>
                <ShareButton $platform="whatsapp" onClick={() => window.open(`https://wa.me/?text=Join Sawaikar's Cashew Store with my referral code ${loyaltyData?.referralCode} and get 100 bonus points! ${window.location.origin}?ref=${loyaltyData?.referralCode}`, '_blank')}>
                  WhatsApp
                </ShareButton>
                <ShareButton $platform="twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join Sawaikar's Cashew Store with my referral code ${loyaltyData?.referralCode} and get 100 bonus points!&url=${window.location.origin}?ref=${loyaltyData?.referralCode}`, '_blank')}>
                  Twitter
                </ShareButton>
                <ShareButton $platform="email" onClick={() => window.open(`mailto:?subject=Join Sawaikar's Cashew Store&body=Use my referral code ${loyaltyData?.referralCode} to get 100 bonus points! ${window.location.origin}?ref=${loyaltyData?.referralCode}`, '_blank')}>
                  <FiMail /> Email
                </ShareButton>
              </ShareButtons>
            </ReferralCodeCard>

            <HowItWorksCard>
              <h3>How It Works</h3>
              <StepsGrid>
                <StepCard>
                  <StepNumber>1</StepNumber>
                  <StepIcon><FiShare2 /></StepIcon>
                  <StepTitle>Share Your Code</StepTitle>
                  <StepDesc>Send your unique referral link to friends and family</StepDesc>
                </StepCard>
                <StepArrow>→</StepArrow>
                <StepCard>
                  <StepNumber>2</StepNumber>
                  <StepIcon><FiUsers /></StepIcon>
                  <StepTitle>Friend Signs Up</StepTitle>
                  <StepDesc>They create an account using your referral link</StepDesc>
                </StepCard>
                <StepArrow>→</StepArrow>
                <StepCard>
                  <StepNumber>3</StepNumber>
                  <StepIcon><FiGift /></StepIcon>
                  <StepTitle>Both Earn Rewards</StepTitle>
                  <StepDesc>You get 200 pts, they get 100 pts after first order</StepDesc>
                </StepCard>
              </StepsGrid>
            </HowItWorksCard>

            <ReferralStatsCard>
              <h3>Your Referral Stats</h3>
              <ReferralStatsGrid>
                <ReferralStatItem>
                  <span className="value">{loyaltyData?.stats?.totalReferrals || 0}</span>
                  <span className="label">Total Referrals</span>
                </ReferralStatItem>
                <ReferralStatItem>
                  <span className="value">{loyaltyData?.stats?.pendingReferrals || 0}</span>
                  <span className="label">Pending</span>
                </ReferralStatItem>
                <ReferralStatItem>
                  <span className="value">{loyaltyData?.stats?.completedReferrals || 0}</span>
                  <span className="label">Completed</span>
                </ReferralStatItem>
                <ReferralStatItem>
                  <span className="value">{(loyaltyData?.stats?.completedReferrals || 0) * 200}</span>
                  <span className="label">Points Earned</span>
                </ReferralStatItem>
              </ReferralStatsGrid>
              {(loyaltyData?.stats?.pendingReferrals || 0) > 0 && (
                <PendingNote>
                  <FiClock /> {loyaltyData.stats.pendingReferrals} referral{loyaltyData.stats.pendingReferrals > 1 ? 's' : ''} waiting for first purchase
                </PendingNote>
              )}
            </ReferralStatsCard>
          </ReferralContent>
        )}
      </ContentSection>
    </Container>
  );
};

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 40px rgba(245, 158, 11, 0.5), 0 0 60px rgba(16, 185, 129, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 60px rgba(245, 158, 11, 0.7), 0 0 80px rgba(16, 185, 129, 0.5);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

// Hero Section
const HeroSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  padding: 48px 24px 160px;
  overflow: hidden;
`;

const HeroPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%);
`;

const HeroContent = styled.div`
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeInUp} 0.6s ease;
`;

const UserGreeting = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const UserAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #1e1b4b;
  border: 3px solid rgba(255,255,255,0.3);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const WelcomeText = styled.div`
  font-size: 14px;
  color: rgba(255,255,255,0.7);
`;

const UserName = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: white;
`;

const HeroMainContent = styled.div`
  display: flex;
  gap: 24px;
  align-items: stretch;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const PointsCard = styled.div`
  flex: 1;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 24px;
  padding: 32px;
`;

const TierSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const TierBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.$bg};
  border-radius: 50px;
  font-weight: 700;
  font-size: 13px;
  color: #1e1b4b;

  .icon {
    font-size: 18px;
  }
`;

const NextTier = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
`;

const MainPoints = styled.div`
  margin-bottom: 24px;
`;

const PointsNumber = styled.div`
  font-size: 64px;
  font-weight: 800;
  color: white;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 48px;
  }
`;

const PointsLabel = styled.div`
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
`;

const PointsStats = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.15);

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const PointsStat = styled.div`
  .value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
  }

  .label {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
  }
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.2);

  @media (max-width: 600px) {
    width: 80px;
    height: 1px;
  }
`;

// Spin Section
const SpinSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 24px;
  padding: 28px 32px;
  min-width: 260px;
  text-align: center;
`;

const SpinTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
`;

const SpinWheel = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    #fcd34d 0deg 30deg,
    #f59e0b 30deg 60deg,
    #10b981 60deg 90deg,
    #fcd34d 90deg 120deg,
    #f59e0b 120deg 150deg,
    #10b981 150deg 180deg,
    #fcd34d 180deg 210deg,
    #f59e0b 210deg 240deg,
    #10b981 240deg 270deg,
    #fcd34d 270deg 300deg,
    #f59e0b 300deg 330deg,
    #10b981 330deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(245, 158, 11, 0.5), 0 0 60px rgba(16, 185, 129, 0.3);
  transform: rotate(${props => props.$rotation}deg);
  transition: ${props => props.$spinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 0.3s ease'};
  animation: ${props => props.$spinning ? 'none' : css`${pulse} 2s ease-in-out infinite`};
  position: relative;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 16px solid #fff;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    z-index: 10;
  }
`;

const WheelInner = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
  border: 3px solid rgba(255,255,255,0.9);
`;

const WheelIcon = styled.div`
  font-size: 32px;
  line-height: 1;
`;

const WheelText = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #1e1b4b;
  margin-top: 2px;
`;

const SpinResultDisplay = styled.div`
  text-align: center;
  color: #1e1b4b;

  .plus {
    font-size: 16px;
    font-weight: 700;
  }

  .points {
    display: block;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }

  .label {
    font-size: 12px;
    font-weight: 600;
  }
`;

const SpinInfo = styled.div`
  text-align: center;

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    margin-bottom: 12px;
  }
`;

const SpinButton = styled.button`
  padding: 14px 36px;
  background: ${props => props.$available ? 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.2)'};
  color: ${props => props.$available ? '#1e1b4b' : 'rgba(255,255,255,0.5)'};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: ${props => props.$available ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
  }
`;

// Tabs
const TabsWrapper = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-top: -100px;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
`;

const TabsNav = styled.div`
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 24px;
  border: none;
  background: transparent;
  color: ${props => props.$active ? '#4338ca' : '#6b7280'};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 3px solid ${props => props.$active ? '#4338ca' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    color: #4338ca;
  }

  svg {
    font-size: 18px;
  }
`;

const ContentSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
`;

// Overview Tab
const OverviewContent = styled.div``;

const QuickStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const QuickStatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-left: 4px solid ${props => props.$color};
`;

const QuickStatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #374151;
`;

const QuickStatInfo = styled.div`
  .value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
  }

  .label {
    font-size: 13px;
    color: #6b7280;
  }
`;

const TierProgressCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
`;

const TierProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
`;

const TierProgressBadge = styled.div`
  padding: 6px 12px;
  background: #f0fdf4;
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
`;

const TierProgressVisual = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const CurrentTierIcon = styled.div`
  font-size: 32px;
`;

const TierProgressBarWrapper = styled.div`
  flex: 1;
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
`;

const TierProgressBar = styled.div`
  height: 100%;
  width: ${props => Math.min(props.$progress, 100)}%;
  background: linear-gradient(90deg, #4338ca 0%, #6366f1 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
`;

const NextTierIcon = styled.div`
  font-size: 32px;
  opacity: 0.5;
`;

const TierProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
`;

const LeaderboardCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
`;

const LeaderboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
`;

const LeaderboardBadge = styled.div`
  padding: 6px 12px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
`;

const LeaderboardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  svg {
    width: 16px;
    height: 16px;
    ${props => props.$isRefreshing && css`
      animation: ${spin} 1s linear infinite;
    `}
  }
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LeaderboardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${props => props.$isUser ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#f9fafb'};
  border: ${props => props.$isUser ? '2px solid #3b82f6' : 'none'};
  border-radius: 14px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(4px);
  }
`;

const RankBadge = styled.div`
  width: 40px;
  font-size: ${props => props.$rank <= 3 ? '24px' : '16px'};
  font-weight: 700;
  color: #4338ca;
  text-align: center;
`;

const LeaderboardUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const LeaderboardAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const LeaderboardName = styled.div`
  font-weight: 600;
  color: #1f2937;
`;

const LeaderboardTier = styled.div`
  font-size: 12px;
  color: ${props => props.$color};
  text-transform: capitalize;
`;

const LeaderboardPoints = styled.div`
  font-weight: 700;
  color: #4338ca;
  font-size: 15px;
`;

// Rewards Tab
const RewardsContent = styled.div``;

const RewardsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }
`;

const PointsBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
  color: white;
  font-weight: 700;
  border-radius: 50px;
`;

const RewardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const RewardCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid ${props => props.$canRedeem ? '#d1fae5' : '#f3f4f6'};
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;

  ${props => props.$canRedeem && `
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
      border-color: #10b981;
    }
  `}

  ${props => !props.$canRedeem && `
    opacity: 0.7;
  `}
`;

const RewardIconWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 20px;
`;

const RewardInfo = styled.div`
  margin-bottom: 24px;
  flex: 1;
`;

const RewardName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
`;

const RewardDescription = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const RewardCost = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #4338ca;
  background: #eef2ff;
  padding: 8px 16px;
  border-radius: 20px;
`;

const RedeemButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: ${props => props.$canRedeem ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6'};
  color: ${props => props.$canRedeem ? 'white' : '#9ca3af'};
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.$canRedeem ? 'pointer' : 'not-allowed'};
  transition: all 0.2s ease;

  ${props => props.$canRedeem && `
    &:hover {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  `}
`;

// Achievements Tab
const AchievementsContent = styled.div``;

const AchievementsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }
`;

const AchievementStats = styled.div`
  font-size: 14px;

  .unlocked {
    font-weight: 600;
    color: #10b981;
  }

  .separator {
    margin: 0 6px;
    color: #d1d5db;
  }

  .total {
    color: #6b7280;
  }
`;

const AchievementsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b'
};

const AchievementCard = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  background: ${props => props.$unlocked ? 'white' : '#fafafa'};
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: ${props => props.$unlocked ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)'};
  border: 1px solid ${props => props.$unlocked ? '#e5e7eb' : '#f3f4f6'};
  opacity: ${props => props.$unlocked ? 1 : 0.85};
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }

  @media (max-width: 640px) {
    padding: 16px;
    gap: 14px;
  }
`;

const AchievementRarityStripe = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: ${props => rarityColors[props.$rarity] || rarityColors.common};
`;

const AchievementIconWrapper = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${props => props.$unlocked ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#f3f4f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  filter: ${props => props.$unlocked ? 'none' : 'grayscale(70%)'};
  flex-shrink: 0;
`;

const UnlockedBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid white;
`;

const AchievementDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const AchievementName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 3px;
`;

const AchievementDesc = styled.div`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
`;

const AchievementProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

const ProgressBarWrapper = styled.div`
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
`;

const AchievementProgressBar = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background: ${props => rarityColors[props.$rarity] || '#4338ca'};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
`;

const UnlockedText = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
`;

const AchievementReward = styled.div`
  background: ${props => props.$claimed ? '#ecfdf5' : props.$unlocked ? '#10b981' : '#f3f4f6'};
  color: ${props => props.$claimed ? '#059669' : props.$unlocked ? 'white' : '#9ca3af'};
  padding: 10px 14px;
  border-radius: 8px;
  text-align: center;
  min-width: 70px;

  .points {
    display: block;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
  }

  .label {
    font-size: 11px;
    opacity: 0.8;
  }
`;

const AchievementRewardSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 90px;
  margin-left: auto;
`;

const ClaimButton = styled.button`
  background: #059669;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #047857;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ClaimedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #059669;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  background: #d1fae5;
  border-radius: 6px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

// Referral Tab
const ReferralContent = styled.div``;

const ReferralHero = styled.div`
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #6b7280;
    max-width: 500px;
    margin: 0 auto;

    strong {
      color: #4338ca;
    }
  }
`;

const ReferralHeroIcon = styled.div`
  font-size: 56px;
  margin-bottom: 16px;
`;

const ReferralCodeCard = styled.div`
  background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  margin-bottom: 32px;
`;

const ReferralCodeLabel = styled.div`
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12px;
`;

const ReferralCodeDisplay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const ReferralCodeText = styled.div`
  padding: 16px 32px;
  background: rgba(255,255,255,0.15);
  border: 2px dashed rgba(255,255,255,0.4);
  border-radius: 12px;
  font-size: 28px;
  font-weight: 800;
  color: white;
  letter-spacing: 3px;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: ${props => props.$copied ? '#10b981' : 'white'};
  color: ${props => props.$copied ? 'white' : '#4338ca'};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ShareButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ShareButton = styled.button`
  padding: 10px 20px;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255,255,255,0.3);
    transform: translateY(-2px);
  }
`;

const HowItWorksCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 32px;
  }
`;

const StepsGrid = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const StepCard = styled.div`
  text-align: center;
  max-width: 200px;
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
  color: white;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepIcon = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #4338ca;
`;

const StepTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
`;

const StepDesc = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const StepArrow = styled.div`
  font-size: 24px;
  color: #d1d5db;

  @media (max-width: 768px) {
    transform: rotate(90deg);
  }
`;

const ReferralStatsCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 20px;
  }
`;

const ReferralStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const ReferralStatItem = styled.div`
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 14px;

  .value {
    display: block;
    font-size: 32px;
    font-weight: 800;
    color: #4338ca;
    margin-bottom: 4px;
  }

  .label {
    font-size: 14px;
    color: #6b7280;
  }
`;

const PendingNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;

  svg {
    flex-shrink: 0;
  }
`;

// Login Prompt
const LoginPromptSection = styled.div`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
`;

const LoginPromptContent = styled.div`
  text-align: center;
  max-width: 500px;
  color: white;

  h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 40px;
    line-height: 1.6;
  }
`;

const LoginIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  text-align: left;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.1);
  border-radius: 14px;
  backdrop-filter: blur(10px);

  h4 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 2px;
  }

  span {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }
`;

const BenefitIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #1e1b4b;
`;

const LoginButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 40px;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  color: #1e1b4b;
  text-decoration: none;
  font-size: 17px;
  font-weight: 700;
  border-radius: 14px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(252, 211, 77, 0.4);
  }
`;

// Loading Skeletons
const HeroSkeleton = styled.div`
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentSkeleton = styled.div`
  max-width: 1200px;
  margin: -80px auto 0;
  padding: 24px;
`;

const SkeletonPulse = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
`;

export default LoyaltyDashboard;
