import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Heart, 
  Laugh, 
  HelpCircle, 
  PartyPopper,
  Rocket,
  Eye,
  Reply,
  Edit3,
  Trash2,
  Send,
  Paperclip,
  AtSign
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  task_id: string;
  parent_comment_id?: string | null;
  is_edited: boolean | null;
  edit_history: any;
  mentions: any;
  attachments: any;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  } | null;
  reactions?: CommentReaction[];
  replies?: Comment[];
  task_comment_reactions?: any[];
}

interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

const REACTION_ICONS = {
  thumbs_up: ThumbsUp,
  thumbs_down: ThumbsDown,
  heart: Heart,
  laugh: Laugh,
  confused: HelpCircle,
  hooray: PartyPopper,
  rocket: Rocket,
  eyes: Eye
};

const REACTION_LABELS = {
  thumbs_up: '👍',
  thumbs_down: '👎',
  heart: '❤️',
  laugh: '😄',
  confused: '😕',
  hooray: '🎉',
  rocket: '🚀',
  eyes: '👀'
};

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
}

export default function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
    
    // Real-time subscription pour les commentaires
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          loadComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comment_reactions'
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const loadComments = async () => {
    try {
      // Charger les commentaires avec leurs auteurs et réactions
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          *,
          task_comment_reactions(*)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Charger les auteurs des commentaires
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          let authorData = null;
          if (comment.user_id) {
            try {
              const { data: employeeData } = await supabase
                .from('employees')
                .select('first_name, last_name')
                .eq('user_id', comment.user_id)
                .maybeSingle();
              
              if (employeeData) {
                authorData = employeeData;
              }
            } catch (error) {
              console.log('Author not found:', comment.user_id);
            }
          }
          
          return {
            ...comment,
            author: authorData,
            reactions: comment.task_comment_reactions || []
          };
        })
      );

      // Organiser en hiérarchie (commentaires parents et réponses)
      const topLevelComments = commentsWithAuthors
        .filter(c => !c.parent_comment_id)
        .map(comment => ({
          ...comment,
          replies: commentsWithAuthors.filter(c => c.parent_comment_id === comment.id)
        })) as Comment[];

      setComments(topLevelComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des commentaires"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_comment_id: parentId || null
        });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de l'ajout du commentaire"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    try {
      // Vérifier si l'utilisateur a déjà cette réaction
      const existingReaction = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.id === commentId)
        ?.reactions?.find(r => r.user_id === currentUserId && r.reaction_type === reactionType);

      if (existingReaction) {
        // Supprimer la réaction
        const { error } = await supabase
          .from('task_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        if (error) throw error;
      } else {
        // Ajouter la réaction
        const { error } = await supabase
          .from('task_comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
            reaction_type: reactionType
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la réaction"
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      
      toast({
        title: "Commentaire modifié",
        description: "Le commentaire a été mis à jour"
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la modification"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression"
      });
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`group ${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author ? 
              `${comment.author.first_name[0]}${comment.author.last_name[0]}` : 
              'U'
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-muted/50 rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author ? 
                    `${comment.author.first_name} ${comment.author.last_name}` : 
                    'Utilisateur'
                  }
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
                {comment.is_edited && (
                  <Badge variant="outline" className="text-xs">modifié</Badge>
                )}
              </div>
              
              {comment.user_id === currentUserId && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Sauvegarder
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm whitespace-pre-wrap mb-3">
                  {comment.content}
                </div>
                
                {/* Réactions */}
                <div className="flex items-center gap-1 mb-2">
                  {Object.entries(REACTION_LABELS).map(([type, emoji]) => {
                    const reactionCount = comment.reactions?.filter(r => r.reaction_type === type).length || 0;
                    const userHasReacted = comment.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === type);
                    
                    if (reactionCount === 0) return null;
                    
                    return (
                      <Button
                        key={type}
                        variant={userHasReacted ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleReaction(comment.id, type)}
                      >
                        {emoji} {reactionCount}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {Object.entries(REACTION_LABELS).slice(0, 4).map(([type, emoji]) => (
                      <Button
                        key={type}
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={() => handleReaction(comment.id, type)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Répondre
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Zone de réponse */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-4">
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Répondre à ${comment.author?.first_name}...`}
                  className="min-h-[80px] resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSubmitComment(comment.id)}
                  disabled={!newComment.trim() || submitting}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Répondre
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
          
          {/* Réponses */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commentaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Commentaires
          <Badge variant="secondary">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nouveau commentaire */}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">Moi</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <AtSign className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground">
                  Ctrl+Entrée pour publier
                </span>
                <Button 
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Commenter
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Liste des commentaires */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">💬</div>
              <p>Aucun commentaire pour l'instant</p>
              <p className="text-sm">Soyez le premier à commenter cette tâche</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>
      </CardContent>
    </Card>
  );
}